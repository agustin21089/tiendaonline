import { prisma } from "@/lib/prisma";
import { CouponsClient } from "./coupons-client";

export const metadata = { title: "Cupones — Admin" };

export default async function CuponesPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type as "PERCENTAGE" | "FIXED",
    value: Number(c.value),
    minOrder: c.minOrder ? Number(c.minOrder) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    active: c.active,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CouponsClient coupons={serialized} />;
}
