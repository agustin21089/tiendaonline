import { prisma } from "@/lib/prisma";
import { CategoryList } from "./category-list";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      children: { select: { id: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Categorías</h1>
          <p className="text-sm text-warm-500 mt-0.5">
            {categories.length} categorías en total
          </p>
        </div>
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
