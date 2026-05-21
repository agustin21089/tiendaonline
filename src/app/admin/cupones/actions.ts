"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CouponInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null; // ISO date string or null
  active: boolean;
};

export async function createCoupon(data: CouponInput) {
  await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase().trim(),
      type: data.type,
      value: data.value,
      minOrder: data.minOrder ?? null,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      active: data.active,
    },
  });
  revalidatePath("/admin/cupones");
}

export async function updateCoupon(id: string, data: CouponInput) {
  await prisma.coupon.update({
    where: { id },
    data: {
      code: data.code.toUpperCase().trim(),
      type: data.type,
      value: data.value,
      minOrder: data.minOrder ?? null,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      active: data.active,
    },
  });
  revalidatePath("/admin/cupones");
}

export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/cupones");
}

export async function toggleCoupon(id: string, active: boolean) {
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/cupones");
}
