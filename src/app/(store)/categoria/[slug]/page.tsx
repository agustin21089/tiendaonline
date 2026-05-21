import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { SortSelect } from "./sort-select";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orden?: string; pagina?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  return { title: cat?.name ?? "Categoría" };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { orden = "nuevo", pagina } = await searchParams;
  const page = Number(pagina ?? 1);
  const perPage = 16;

  const category = await prisma.category.findUnique({
    where: { slug, active: true },
    include: { children: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!category) notFound();

  // Incluir productos de subcategorías también
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const orderBy =
    orden === "precio-asc"
      ? { price: "asc" as const }
      : orden === "precio-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: { in: categoryIds }, active: true },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({
      where: { categoryId: { in: categoryIds }, active: true },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-warm-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-arena-600 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-warm-700">{category.name}</span>
      </nav>

      {/* Header de categoría */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light text-warm-900">{category.name}</h1>
        {category.description && (
          <p className="text-warm-500 mt-2 max-w-2xl">{category.description}</p>
        )}
      </div>

      {/* Subcategorías */}
      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/categoria/${slug}`}
            className="px-4 py-1.5 rounded-full text-sm border border-arena-300 text-arena-700 bg-arena-50 font-medium"
          >
            Todo
          </Link>
          {category.children.map((sub) => (
            <Link
              key={sub.slug}
              href={`/categoria/${sub.slug}`}
              className="px-4 py-1.5 rounded-full text-sm border border-arena-200 text-warm-600 hover:border-arena-400 hover:text-arena-700 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-warm-500">{total} productos</p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-warm-500">Ordenar:</label>
          <SortSelect currentOrden={orden} />
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-lg">No hay productos en esta categoría aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => {
            const img = p.images[0];
            const price = Number(p.price);
            const comparePrice = p.comparePrice ? Number(p.comparePrice) : null;
            const discount = comparePrice
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : null;

            return (
              <div key={p.id} className="group flex flex-col">
                <Link href={`/producto/${p.slug}`}>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-arena-100 mb-3">
                    {img ? (
                      <Image
                        src={img.url}
                        alt={img.alt ?? p.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-arena-100" />
                    )}
                    {discount && (
                      <span className="absolute top-2 left-2 bg-arena-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-warm-800 group-hover:text-arena-600 transition-colors line-clamp-2 mb-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-semibold text-warm-900">
                      {formatPrice(price)}
                    </span>
                    {comparePrice && (
                      <span className="text-xs text-warm-400 line-through">
                        {formatPrice(comparePrice)}
                      </span>
                    )}
                  </div>
                </Link>
                <AddToCartButton
                  product={{ id: p.id, name: p.name, slug: p.slug, price, image: img?.url ?? null, stock: p.stock }}
                  className="mt-auto"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/categoria/${slug}?orden=${orden}&pagina=${p}`}
              className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? "bg-arena-500 text-white"
                  : "text-warm-600 hover:bg-arena-100"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
