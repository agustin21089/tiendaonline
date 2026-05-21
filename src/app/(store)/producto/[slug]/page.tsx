import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "./product-gallery";
import { ProductActions } from "./product-actions";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  return {
    title: product?.metaTitle ?? product?.name ?? "Producto",
    description: product?.metaDescription ?? product?.description ?? undefined,
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      images: { orderBy: { order: "asc" } },
      category: { include: { parent: { select: { name: true, slug: true } } } },
      variants: { orderBy: [{ name: "asc" }, { value: "asc" }] },
    },
  });
  if (!product) notFound();

  // Relacionados
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, active: true, id: { not: product.id } },
    include: { images: { take: 1, orderBy: { order: "asc" } } },
    take: 4,
    orderBy: { featured: "desc" },
  });

  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-warm-400 mb-8 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-arena-600 transition-colors">Inicio</Link>
        <span>/</span>
        {product.category.parent && (
          <>
            <Link href={`/categoria/${product.category.parent.slug}`} className="hover:text-arena-600 transition-colors">
              {product.category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <Link href={`/categoria/${product.category.slug}`} className="hover:text-arena-600 transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-warm-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Galería */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-sm text-arena-600 font-medium mb-2">{product.category.name}</p>
          <h1 className="font-display text-3xl md:text-4xl font-light text-warm-900 mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Precio */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-semibold text-warm-900">{formatPrice(price)}</span>
            {comparePrice && (
              <span className="text-lg text-warm-400 line-through">{formatPrice(comparePrice)}</span>
            )}
            {discount && (
              <span className="bg-arena-100 text-arena-700 text-sm font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          <p className="text-xs text-warm-400 mb-6">Precio en pesos argentinos. IVA incluido.</p>

          {/* Stock */}
          <div className="mb-6">
            {product.stock === 0 ? (
              <p className="text-sm text-red-600 font-medium">Sin stock disponible</p>
            ) : product.stock <= 5 ? (
              <p className="text-sm text-yellow-600 font-medium">¡Últimas {product.stock} unidades!</p>
            ) : (
              <p className="text-sm text-green-600 font-medium">En stock</p>
            )}
          </div>

          {/* Acciones (cliente — variantes + cantidad + agregar) */}
          <ProductActions
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price,
              image: product.images[0]?.url ?? null,
              stock: product.stock,
            }}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              price: v.price ? Number(v.price) : null,
              stock: v.stock,
              sku: v.sku,
            }))}
          />

          {/* Descripción */}
          {product.description && (
            <div className="mt-8 pt-8 border-t border-arena-100">
              <h2 className="font-display text-lg font-medium text-warm-800 mb-3">Descripción</h2>
              <p className="text-warm-600 leading-relaxed whitespace-pre-line text-sm">
                {product.description}
              </p>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-warm-300 mt-4">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {/* Productos relacionados */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-arena-100">
          <h2 className="font-display text-2xl font-light text-warm-800 mb-7">
            También te puede gustar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {related.map((p) => {
              const img = p.images[0];
              return (
                <Link key={p.id} href={`/producto/${p.slug}`} className="group">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-arena-100 mb-3">
                    {img && (
                      <Image
                        src={img.url}
                        alt={img.alt ?? p.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium text-warm-800 group-hover:text-arena-600 transition-colors line-clamp-2">
                    {p.name}
                  </p>
                  <p className="text-sm font-semibold text-warm-900 mt-1">
                    {formatPrice(Number(p.price))}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
