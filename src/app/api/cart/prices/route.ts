import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0) return Response.json({});

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, price: true, stock: true, active: true },
  });

  const map = Object.fromEntries(
    products.map((p) => [p.id, { price: Number(p.price), stock: p.stock, active: p.active }])
  );

  return Response.json(map);
}
