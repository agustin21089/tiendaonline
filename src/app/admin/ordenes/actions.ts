"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  trackingNumber: z.string().optional(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateOrder(id: string, data: z.infer<typeof updateOrderSchema>) {
  await prisma.order.update({
    where: { id },
    data: updateOrderSchema.parse(data),
  });
  revalidatePath("/admin/ordenes");
}
