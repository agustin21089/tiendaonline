"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { mpClient, Preference } from "@/lib/mp";

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

export async function createOrder(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
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

  const notes = [email ? `Email: ${email}` : null, notesRaw || null]
    .filter(Boolean)
    .join("\n") || null;

  const subtotal = validItems.reduce((sum, i) => sum + (priceMap.get(i.productId) ?? i.price) * i.quantity, 0);

  let orderId: string;
  try {
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod,
        subtotal,
        total: subtotal,
        shippingName: name,
        shippingPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingZip: zip,
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
    });
    orderId = order.id;
  } catch (e) {
    console.error("Error creating order:", e);
    return { error: "Error al crear el pedido. Por favor intentá de nuevo." };
  }

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
      return { error: "Error al conectar con MercadoPago. Intentá con otro método de pago." };
    }
  }

  redirect(`/orden/${orderId}`);
}
