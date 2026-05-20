import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getData() {
  const [banners, categories, featuredProducts] = await Promise.all([
    prisma.banner.findMany({
      where: { active: true, position: "HOME_HERO" },
      orderBy: { order: "asc" },
      take: 3,
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
    <div className="min-h-screen bg-arena-50">
      {/* Header */}
      <header className="bg-white border-b border-arena-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-display text-xl font-semibold text-arena-700">
              Decoración & Hogar
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="text-sm text-warm-600 hover:text-arena-600 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/carrito"
                className="relative p-2 text-warm-600 hover:text-arena-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      {banners.length > 0 ? (
        <div className="relative h-[60vh] bg-arena-200 overflow-hidden">
          <Image
            src={banners[0].image}
            alt={banners[0].title ?? "Banner principal"}
            fill
            className="object-cover"
            priority
          />
          {(banners[0].title || banners[0].subtitle) && (
            <div className="absolute inset-0 bg-black/20 flex items-end">
              <div className="p-8 max-w-2xl">
                {banners[0].title && (
                  <h1 className="font-display text-4xl md:text-5xl font-light text-white mb-2">
                    {banners[0].title}
                  </h1>
                )}
                {banners[0].subtitle && (
                  <p className="text-white/90 text-lg">{banners[0].subtitle}</p>
                )}
                {banners[0].link && (
                  <Link
                    href={banners[0].link}
                    className="mt-4 inline-block px-6 py-2.5 bg-white text-arena-800 rounded-full text-sm font-medium hover:bg-arena-50 transition-colors"
                  >
                    Ver colección
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-64 bg-gradient-to-br from-arena-100 to-arena-200 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl text-arena-700 font-light">
              Bienvenidos a nuestra tienda
            </h1>
            <p className="text-arena-500 mt-2">Decoración y accesorios para tu hogar</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Categorías */}
        {categories.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-light text-warm-800 mb-6">
              Explorá por categoría
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-arena-100 hover:opacity-90 transition-opacity"
                >
                  {cat.image && (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                    <span className="text-white font-medium text-sm">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Productos destacados */}
        {featuredProducts.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-light text-warm-800 mb-6">
              Productos destacados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="group"
                >
                  <div className="aspect-square overflow-hidden rounded-2xl bg-arena-100 mb-3">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt ?? product.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-arena-300">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-warm-800 group-hover:text-arena-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-warm-900">
                      {formatPrice(Number(product.price))}
                    </span>
                    {product.comparePrice && (
                      <span className="text-xs text-warm-400 line-through">
                        {formatPrice(Number(product.comparePrice))}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {featuredProducts.length === 0 && categories.length === 0 && (
          <div className="text-center py-16 text-warm-400">
            <p className="text-lg font-display">La tienda está siendo configurada</p>
            <p className="text-sm mt-2">Pronto vas a ver nuestros productos acá</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-warm-900 text-warm-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="font-display text-lg text-warm-100 mb-2">Decoración & Hogar</p>
          <p className="text-sm">Tu tienda de decoración</p>
        </div>
      </footer>
    </div>
  );
}
