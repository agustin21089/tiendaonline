import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "../product-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } }, variants: { orderBy: { name: "asc" } } },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Editar producto</h1>
        <p className="text-sm text-warm-500 mt-0.5">
          <a href="/admin/productos" className="text-arena-600 hover:underline">
            Productos
          </a>{" "}
          / {product.name}
        </p>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
