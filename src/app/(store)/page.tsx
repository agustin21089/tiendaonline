import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { BannerSlider } from "@/components/store/banner-slider";

export const dynamic = "force-dynamic";

async function getData() {
  const [banners, categories, featuredProducts] = await Promise.all([
    prisma.banner.findMany({
      where: { active: true, position: "HOME_HERO" },
      orderBy: { order: "asc" },
      take: 10,
    }),
    prisma.category.findMany({
      where: { active: true, parentId: null },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);
  return { banners, categories, featuredProducts };
}

export default async function HomePage() {
  const { banners, categories, featuredProducts } = await getData();

  return (
    <div>
      {/* Hero Slider */}
      <BannerSlider banners={banners} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* Categorías */}
        {categories.length > 0 && (
          <section>
            <h2 className="font-display text-3xl font-light text-warm-800 mb-7">
              Explorá por categoría
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-arena-100"
                >
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-arena-100 to-arena-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-white font-medium text-sm">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Destacados */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-7">
              <h2 className="font-display text-3xl font-light text-warm-800">
                Productos destacados
              </h2>
              <Link
                href="/"
                className="text-sm text-arena-600 hover:text-arena-700 font-medium transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Banner secundario */}
        <section className="rounded-3xl bg-arena-100 overflow-hidden">
          <div className="px-8 py-12 md:px-16 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-arena-600 uppercase tracking-widest mb-2">
                Nueva colección
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light text-warm-900">
                Dormitorio — Otoño 2025
              </h2>
              <p className="text-warm-500 mt-2 max-w-md">
                Texturas suaves, colores tierra y materiales naturales para crear el refugio perfecto.
              </p>
            </div>
            <Link
              href="/categoria/dormitorio"
              className="shrink-0 px-8 py-3 bg-warm-900 text-white rounded-full text-sm font-medium hover:bg-warm-700 transition-colors"
            >
              Explorar colección →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: { toString(): string };
    comparePrice: { toString(): string } | null;
    stock: number;
    images: { url: string; alt: string | null }[];
  };
}) {
  const img = product.images[0];
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : null;

  return (
    <div className="group flex flex-col">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-arena-100 mb-3">
          {img ? (
            <Image
              src={img.url}
              alt={img.alt ?? product.name}
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
        <h3 className="text-sm font-medium text-warm-800 group-hover:text-arena-600 transition-colors line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-semibold text-warm-900">{formatPrice(price)}</span>
          {comparePrice && (
            <span className="text-xs text-warm-400 line-through">{formatPrice(comparePrice)}</span>
          )}
        </div>
      </Link>
      <AddToCartButton
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          image: img?.url ?? null,
          stock: product.stock,
        }}
      />
    </div>
  );
}
