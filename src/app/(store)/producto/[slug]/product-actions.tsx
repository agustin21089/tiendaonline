"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    stock: number;
  };
}

export function ProductActions({ product }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return (
      <Button disabled className="w-full" size="lg">
        Sin stock
      </Button>
    );
  }

  function handleAdd() {
    add({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Cantidad */}
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
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            className="w-10 h-10 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Botón agregar */}
      <Button
        onClick={handleAdd}
        size="lg"
        className={`w-full transition-all ${added ? "bg-green-600 hover:bg-green-600" : ""}`}
      >
        {added ? (
          <><Check className="w-5 h-5" /> ¡Agregado al carrito!</>
        ) : (
          <><ShoppingBag className="w-5 h-5" /> Agregar al carrito</>
        )}
      </Button>

      {/* Ir al checkout directo */}
      <Button variant="outline" size="lg" className="w-full" asChild>
        <a href="/checkout">Comprar ahora →</a>
      </Button>
    </div>
  );
}
