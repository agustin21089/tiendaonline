"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { formatPrice } from "@/lib/utils";
import { SortSelect } from "@/app/(store)/categoria/[slug]/sort-select";

type Subcategory = { id: string; name: string };

export type ProductItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  categoryId: string;
  stock: number;
  image: string | null;
  discount: number | null;
};

interface Props {
  products: ProductItem[];
  subcategories: Subcategory[];
  total: number;
  currentOrden: string;
}

export function CategoryProducts({ products, subcategories, total, currentOrden }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered =
    selectedIds.size === 0
      ? products
      : products.filter((p) => selectedIds.has(p.categoryId));

  return (
    <>
      {/* Subcategory chips */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedIds(new Set())}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedIds.size === 0
                ? "bg-arena-600 text-white border-arena-600"
                : "border-arena-200 text-warm-600 hover:border-arena-400 hover:text-arena-700"
            }`}
          >
            Todos
          </button>
          {subcategories.map((sub) => {
            const active = selectedIds.has(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => toggle(sub.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-arena-600 text-white border-arena-600"
                    : "border-arena-200 text-warm-600 hover:border-arena-400 hover:text-arena-700"
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-warm-500">
          {selectedIds.size > 0 ? (
            <>
              <span className="font-medium text-warm-700">{filtered.length}</span> de {total} productos
            </>
          ) : (
            <>{total} productos</>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-warm-500">Ordenar:</label>
          <SortSelect currentOrden={currentOrden} />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p>No hay productos en esta subcategoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <div key={p.id} className="group flex flex-col">
              <Link href={`/producto/${p.slug}`}>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-arena-100 mb-3">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-arena-100" />
                  )}
                  {p.discount && (
                    <span className="absolute top-2 left-2 bg-arena-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      -{p.discount}%
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-warm-800 group-hover:text-arena-600 transition-colors line-clamp-2 mb-1">
                  {p.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-semibold text-warm-900">{formatPrice(p.price)}</span>
                  {p.comparePrice && (
                    <span className="text-xs text-warm-400 line-through">{formatPrice(p.comparePrice)}</span>
                  )}
                </div>
              </Link>
              <AddToCartButton
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price,
                  image: p.image,
                  stock: p.stock,
                }}
                className="mt-auto"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
