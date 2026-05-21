"use server";

import { prisma } from "./prisma";

const RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type ReserveItem = {
  productId: string;
  quantity: number;
};

export type ReserveResult =
  | { ok: true }
  | { ok: false; error: string; outOfStock: string[] };

/** Purge all expired reservations (lazy cleanup — call on each reserve attempt). */
async function purgeExpired() {
  await prisma.stockReservation.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

/**
 * Reserve stock for a checkout session.
 * Releases any previous reservation for the same sessionId first.
 */
export async function reserveStock(
  items: ReserveItem[],
  sessionId: string
): Promise<ReserveResult> {
  if (!items.length || !sessionId) return { ok: true };

  await purgeExpired();

  // Release any existing reservation for this session
  await prisma.stockReservation.deleteMany({ where: { sessionId } });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true, name: true, stock: true, trackStock: true },
  });

  // Sum of ALL active reservations for each product (excluding this session, already deleted)
  const reservationSums = await prisma.stockReservation.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  });
  const reservedMap = new Map(
    reservationSums.map((r) => [r.productId, r._sum.quantity ?? 0])
  );

  const outOfStock: string[] = [];
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (!product.trackStock) continue;

    const alreadyReserved = reservedMap.get(item.productId) ?? 0;
    const available = product.stock - alreadyReserved;

    if (available < item.quantity) {
      outOfStock.push(product.name);
    }
  }

  if (outOfStock.length > 0) {
    return {
      ok: false,
      error: `Sin stock suficiente: ${outOfStock.join(", ")}`,
      outOfStock,
    };
  }

  // Create new reservations
  await prisma.stockReservation.createMany({
    data: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      sessionId,
      expiresAt,
    })),
  });

  return { ok: true };
}

/** Release all reservations for a session (call after successful order). */
export async function releaseReservation(sessionId: string) {
  await prisma.stockReservation.deleteMany({ where: { sessionId } });
}

/** Verify a reservation is still valid (not expired, quantities match). */
export async function verifyReservation(
  sessionId: string,
  items: ReserveItem[]
): Promise<boolean> {
  if (!sessionId || !items.length) return true; // no reservation = skip check

  const reservations = await prisma.stockReservation.findMany({
    where: { sessionId, expiresAt: { gt: new Date() } },
  });

  for (const item of items) {
    const reserved = reservations
      .filter((r) => r.productId === item.productId)
      .reduce((sum, r) => sum + r.quantity, 0);
    if (reserved < item.quantity) return false;
  }

  return true;
}

/** Decrement product stock for completed orders. */
export async function decrementStock(items: ReserveItem[]) {
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
}
