import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pendingOrders, lowStockProducts, recentOrdersList] = await Promise.all([
    // Orders waiting for action
    prisma.order.count({
      where: { status: "PENDING" },
    }),

    // Products with low stock
    prisma.product.findMany({
      where: { trackStock: true, stock: { lte: 5 }, active: true },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),

    // Last 5 new orders (for the dropdown preview)
    prisma.order.findMany({
      select: {
        id: true,
        number: true,
        shippingName: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    pendingOrders,
    lowStock: lowStockProducts.length,
    lowStockProducts,
    recentOrders: recentOrdersList.map((o) => ({
      id: o.id,
      number: o.number,
      name: o.shippingName,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
