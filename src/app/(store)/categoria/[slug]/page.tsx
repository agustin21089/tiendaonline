import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CategoryProducts, type ProductItem } from "@/components/store/category-products";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orden?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  return { title: cat?.name ?? "Categoría" };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { orden = "nuevo" } = await searchParams;

  const category = await prisma.category.findUnique({
    where: { slug, active: true },
    include: { children: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const orderBy =
    orden === "precio-asc"
      ? { price: "asc" as const }
      : orden === "precio-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds }, active: true },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy,
    take: 200, // generous limit — client handles filtering/display
  });

  const productItems: ProductItem[] = products.map((p) => {
    const price = Number(p.price);
    const comparePrice = p.comparePrice ? Number(p.comparePrice) : null;
    const discount = comparePrice
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price,
      comparePrice,
      categoryId: p.categoryId,
      stock: p.stock,
      image: p.images[0]?.url ?? null,
      discount,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-warm-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-arena-600 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-warm-700">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light text-warm-900">{category.name}</h1>
        {category.description && (
          <p className="text-warm-500 mt-2 max-w-2xl">{category.description}</p>
        )}
      </div>

      {/* Products + chips (client component) */}
      <CategoryProducts
        products={productItems}
        subcategories={category.children.map((c) => ({ id: c.id, name: c.name }))}
        total={productItems.length}
        currentOrden={orden}
      />
    </div>
  );
}
