"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type CartItemInput = {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
};

export type CheckoutState = {
  error?: string;
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

  const notes = [
    email ? `Email: ${email}` : null,
    notesRaw || null,
  ]
    .filter(Boolean)
    .join("\n") || null;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
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

  redirect(`/orden/${orderId}`);
}
