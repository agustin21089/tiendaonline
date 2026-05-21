"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { mpClient, Preference } from "@/lib/mp";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { calculateShipping, type ShippingResult } from "@/lib/shipping";
import { reserveStock, releaseReservation, decrementStock } from "@/lib/stock-reservation";
import { notifyAdminWhatsApp, buildNewOrderMessage } from "@/lib/whatsapp";

// Re-export so CheckoutForm can call it as a server action
export { reserveStock };

export type CartItemInput = {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
};

export type CheckoutState = {
  error?: string;
  mpUrl?: string;
};

// ─── Coupon validation ─────────────────────────────────────────────────────────

export type CouponResult =
  | { ok: true; discount: number; label: string }
  | { ok: false; error: string };

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  if (!code.trim()) return { ok: false, error: "Ingresá un código de cupón" };

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!coupon) return { ok: false, error: "Código de cupón inválido" };
  if (!coupon.active) return { ok: false, error: "Este cupón está inactivo" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, error: "Este cupón ha vencido" };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Este cupón ya alcanzó su límite de usos" };
  }
  if (coupon.minOrder !== null && subtotal < Number(coupon.minOrder)) {
    const min = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(Number(coupon.minOrder));
    return { ok: false, error: `Compra mínima requerida: ${min}` };
  }

  let discount: number;
  if (coupon.type === "PERCENTAGE") {
    discount = Math.round((subtotal * Number(coupon.value)) / 100);
  } else {
    discount = Math.min(Number(coupon.value), subtotal);
  }

  const label =
    coupon.type === "PERCENTAGE"
      ? `${coupon.value}% de descuento`
      : new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
        }).format(discount) + " de descuento";

  return { ok: true, discount, label };
}

// ─── Shipping calculation (re-exported for checkout form) ─────────────────────

export async function getShippingOptions(
  zip: string,
  subtotal: number
): Promise<ShippingResult> {
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" }, select: { freeShippingMin: true } })
    .catch(() => null);

  const freeMin = settings?.freeShippingMin ? Number(settings.freeShippingMin) : null;
  return calculateShipping(zip, subtotal, freeMin);
}

// ─── Create order ──────────────────────────────────────────────────────────────

export async function createOrder(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zip = formData.get("zip") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const notesRaw = formData.get("notes") as string;
  const cartJson = formData.get("cartItems") as string;
  const couponCode = (formData.get("couponCode") as string) || null;
  const shippingOptionId = (formData.get("shippingOptionId") as string) || null;
  const shippingPrice = parseFloat((formData.get("shippingPrice") as string) || "0") || 0;

  if (!name || !phone || !address || !city || !state || !zip || !paymentMethod) {
    return { error: "Por favor completá todos los campos obligatorios." };
  }

  let items: CartItemInput[];
  try {
    items = JSON.parse(cartJson);
  } catch {
    return { error: "Error al procesar el carrito. Por favor intentá de nuevo." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "El carrito está vacío." };
  }

  // Re-fetch prices from DB — never trust client-sent prices
  const productIds = items.map((i) => i.productId);
  const freshProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true, price: true, stock: true },
  });

  if (freshProducts.length === 0) {
    return { error: "No se encontraron los productos. Por favor recargá el carrito." };
  }

  const priceMap = new Map(freshProducts.map((p) => [p.id, Number(p.price)]));
  const validItems = items.filter((i) => priceMap.has(i.productId));

  if (validItems.length === 0) {
    return { error: "Los productos del carrito no están disponibles." };
  }

  const subtotal = validItems.reduce(
    (sum, i) => sum + (priceMap.get(i.productId) ?? i.price) * i.quantity,
    0
  );

  // Validate and apply coupon server-side
  let discount = 0;
  let validatedCouponCode: string | null = null;
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, subtotal);
    if (couponResult.ok) {
      discount = couponResult.discount;
      validatedCouponCode = couponCode.toUpperCase().trim();
    }
    // If invalid, ignore silently — don't block the order
  }

  const reservationSessionId = (formData.get("reservationSessionId") as string) || null;
  const shipping = shippingPrice;
  const total = Math.max(0, subtotal - discount) + shipping;

  const notes = [email ? `Email: ${email}` : null, notesRaw || null]
    .filter(Boolean)
    .join("\n") || null;

  let order: { id: string; number: number };
  try {
    order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: validatedCouponCode,
        shippingName: name,
        shippingPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingZip: zip,
        shippingMethod: shippingOptionId,
        notes,
        items: {
          create: validItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: priceMap.get(item.productId) ?? item.price,
            quantity: item.quantity,
          })),
        },
      },
      select: { id: true, number: true },
    });

    // Increment coupon usage
    if (validatedCouponCode) {
      await prisma.coupon
        .update({
          where: { code: validatedCouponCode },
          data: { usedCount: { increment: 1 } },
        })
        .catch((e: unknown) => console.error("Error incrementing coupon usage:", e));
    }

    // Decrement product stock + release reservation (non-blocking)
    const stockItems = validItems.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    decrementStock(stockItems).catch((e: unknown) => console.error("Error decrementing stock:", e));
    if (reservationSessionId) {
      releaseReservation(reservationSessionId).catch(() => {});
    }
  } catch (e) {
    console.error("Error creating order:", e);
    return { error: "Error al crear el pedido. Por favor intentá de nuevo." };
  }

  const orderId = order.id;

  // Load site settings once for email template + WhatsApp
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" }, select: { adminWhatsapp: true, emailOrderTemplate: true } })
    .catch(() => null);

  // Send order confirmation email (non-blocking)
  if (email) {
    sendOrderConfirmationEmail(email, name, order.number, total, settings?.emailOrderTemplate).catch((e) =>
      console.error("Error sending order confirmation email:", e)
    );
  }

  // Notify admin via WhatsApp (non-blocking)
  const waMsg = buildNewOrderMessage(order.number, name, total, validItems.length, city);
  notifyAdminWhatsApp(waMsg, settings?.adminWhatsapp).catch((e) =>
    console.error("WhatsApp notification error:", e)
  );

  if (paymentMethod === "mercadopago") {
    try {
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const preference = new Preference(mpClient);
      const result = await preference.create({
        body: {
          items: validItems.map((item) => ({
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            unit_price: priceMap.get(item.productId) ?? item.price,
            currency_id: "ARS",
          })),
          external_reference: orderId,
          back_urls: {
            success: `${baseUrl}/orden/${orderId}?payment=approved`,
            failure: `${baseUrl}/orden/${orderId}?payment=rejected`,
            pending: `${baseUrl}/orden/${orderId}?payment=pending`,
          },
          auto_return: "approved",
          notification_url: `${baseUrl}/api/mp/webhook`,
        },
      });

      const isTest = process.env.MP_ACCESS_TOKEN?.startsWith("TEST-");
      const mpUrl = isTest ? result.sandbox_init_point! : result.init_point!;
      return { mpUrl };
    } catch (e) {
      console.error("Error creating MP preference:", e);
      return {
        error:
          "Error al conectar con MercadoPago. Intentá con otro método de pago.",
      };
    }
  }

  redirect(`/orden/${orderId}`);
}
