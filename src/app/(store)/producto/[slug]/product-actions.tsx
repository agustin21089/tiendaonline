"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  value: string;
  price: number | null;
  stock: number;
  sku: string | null; // hex for color variants
};

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    stock: number;
  };
  variants: Variant[];
}

// Group variants by name: { "Color": [...], "Tamaño": [...] }
function groupVariants(variants: Variant[]) {
  const map = new Map<string, Variant[]>();
  for (const v of variants) {
    if (!map.has(v.name)) map.set(v.name, []);
    map.get(v.name)!.push(v);
  }
  return map;
}

export function ProductActions({ product, variants }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Variant>>({});

  const groups = groupVariants(variants);

  // Determine effective price and stock
  // If a variant with price override is selected, use it; otherwise use product base price
  const selectedValues = Object.values(selectedVariants);
  const variantPrice = selectedValues.find((v) => v.price != null)?.price ?? null;
  const effectivePrice = variantPrice ?? product.price;

  // Stock: if variants exist, use the selected variant's stock (or 0 if not all selected)
  const allGroupsSelected = groups.size === 0 || Object.keys(selectedVariants).length === groups.size;
  const variantStock = allGroupsSelected && selectedValues.length > 0
    ? Math.min(...selectedValues.map((v) => v.stock))
    : product.stock;
  const effectiveStock = groups.size > 0 ? variantStock : product.stock;

  const missingSelections = Array.from(groups.keys()).filter((k) => !selectedVariants[k]);

  function handleAdd() {
    if (missingSelections.length > 0) return;

    const variantLabel = Object.entries(selectedVariants)
      .map(([name, v]) => `${name}: ${v.value}`)
      .join(", ");

    add({
      productId: product.id,
      name: product.name + (variantLabel ? ` (${variantLabel})` : ""),
      slug: product.slug,
      price: effectivePrice,
      image: product.image,
      stock: effectiveStock,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (effectiveStock === 0 && allGroupsSelected) {
    return (
      <Button disabled className="w-full" size="lg">
        Sin stock
      </Button>
    );
  }

  return (
    <div className="space-y-5">
      {/* Variant selectors */}
      {Array.from(groups.entries()).map(([groupName, options]) => (
        <div key={groupName}>
          <p className="text-sm font-medium text-warm-700 mb-2">
            {groupName}
            {selectedVariants[groupName] && (
              <span className="ml-2 text-warm-500 font-normal">
                — {selectedVariants[groupName].value}
                {selectedVariants[groupName].price != null && (
                  <span className="ml-1 text-arena-600 font-medium">
                    ({formatPrice(selectedVariants[groupName].price!)})
                  </span>
                )}
              </span>
            )}
          </p>

          {groupName === "Color" ? (
            // Color swatches
            <div className="flex flex-wrap gap-2">
              {options.map((v) => {
                const isSelected = selectedVariants[groupName]?.id === v.id;
                const hex = v.sku || "#b08050";
                return (
                  <button
                    key={v.id}
                    type="button"
                    title={v.value}
                    onClick={() => setSelectedVariants((prev) => ({ ...prev, [groupName]: v }))}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      isSelected ? "border-arena-600 scale-110 shadow-sm" : "border-warm-200 hover:border-arena-400"
                    } ${v.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: hex }}
                    disabled={v.stock === 0}
                  />
                );
              })}
            </div>
          ) : (
            // Pill buttons for size/other
            <div className="flex flex-wrap gap-2">
              {options.map((v) => {
                const isSelected = selectedVariants[groupName]?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariants((prev) => ({ ...prev, [groupName]: v }))}
                    disabled={v.stock === 0}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      isSelected
                        ? "bg-arena-600 text-white border-arena-600"
                        : v.stock === 0
                          ? "border-arena-100 text-warm-300 line-through cursor-not-allowed"
                          : "border-arena-200 text-warm-700 hover:border-arena-500"
                    }`}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Missing selection warning */}
      {missingSelections.length > 0 && (
        <p className="text-xs text-arena-600">
          Seleccioná: {missingSelections.join(", ")}
        </p>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-warm-700">Cantidad</span>
        <div className="flex items-center border border-arena-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold text-warm-800">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))}
            className="w-10 h-10 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <Button
        onClick={handleAdd}
        size="lg"
        disabled={missingSelections.length > 0}
        className={`w-full transition-all ${added ? "bg-green-600 hover:bg-green-600" : ""}`}
      >
        {added ? (
          <><Check className="w-5 h-5" /> ¡Agregado!</>
        ) : (
          <><ShoppingBag className="w-5 h-5" /> Agregar al carrito — {formatPrice(effectivePrice)}</>
        )}
      </Button>

      <Button variant="outline" size="lg" className="w-full" asChild>
        <a href="/checkout">Comprar ahora →</a>
      </Button>
    </div>
  );
}
