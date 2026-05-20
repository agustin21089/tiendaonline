import { prisma } from "@/lib/prisma";
import { ProductTable } from "./product-table";
import { BulkPriceModal } from "./bulk-price-modal";

interface Props {
  searchParams: Promise<{ q?: string; categoria?: string; stockBajo?: string; pagina?: string }>;
}

export default async function ProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.pagina ?? 1);
  const perPage = 20;

  const where = {
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {}),
    ...(params.categoria ? { categoryId: params.categoria } : {}),
    ...(params.stockBajo === "1" ? { stock: { lte: 5 }, trackStock: true } : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, parentId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Productos</h1>
          <p className="text-sm text-warm-500 mt-0.5">{total} productos</p>
        </div>
        <div className="flex gap-2">
          <BulkPriceModal categories={categories} />
          <a
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 h-10 px-4 bg-arena-500 text-white rounded-lg text-sm font-medium hover:bg-arena-600 transition-colors"
          >
            + Nuevo producto
          </a>
        </div>
      </div>

      <ProductTable
        products={products}
        total={total}
        page={page}
        perPage={perPage}
        categories={categories}
        filters={params}
      />
    </div>
  );
}
