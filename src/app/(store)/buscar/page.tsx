import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { SearchInput } from "./search-input";
import { Search } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Búsqueda: "${q}"` : "Buscar productos" };
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const products = query
    ? await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
        orderBy: { featured: "desc" },
        take: 40,
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-light text-warm-900 mb-6">Buscar</h1>

      <SearchInput defaultValue={query} />

      {query && (
        <p className="text-sm text-warm-500 mt-4 mb-8">
          {products.length === 0
            ? `Sin resultados para "${query}"`
            : `${products.length} resultado${products.length !== 1 ? "s" : ""} para "${query}"`}
        </p>
      )}

      {products.length > 0 && (
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

      {!query && (
        <div className="text-center py-20 text-warm-400">
          <Search className="w-12 h-12 text-arena-200 mx-auto mb-3" />
          <p className="text-base">Escribí algo para buscar productos</p>
        </div>
      )}

      {query && products.length === 0 && (
        <div className="text-center py-20 text-warm-400">
          <Search className="w-12 h-12 text-arena-200 mx-auto mb-3" />
          <p className="text-base mb-2">No encontramos productos para "{query}"</p>
          <p className="text-sm">Probá con otras palabras o explorá nuestras categorías</p>
        </div>
      )}
    </div>
  );
}
