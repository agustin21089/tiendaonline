import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export default async function NuevoProductoPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Nuevo producto</h1>
        <p className="text-sm text-warm-500 mt-0.5">
          <a href="/admin/productos" className="text-arena-600 hover:underline">
            Productos
          </a>{" "}
          / Nuevo
        </p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
