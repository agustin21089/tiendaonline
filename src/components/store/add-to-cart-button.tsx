"use client";

import { useCart } from "@/context/cart-context";
import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    stock: number;
  };
  quantity?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export function AddToCartButton({ product, quantity = 1, className, size = "md" }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return (
      <button
        disabled
        className={cn(
          "w-full inline-flex items-center justify-center rounded-xl font-medium",
          "bg-warm-100 text-warm-400 cursor-not-allowed",
          sizes[size],
          className,
        )}
      >
        Sin stock
      </button>
    );
  }

  function handleAdd() {
    add({ productId: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image, stock: product.stock, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      onClick={handleAdd}
      className={cn(
        "w-full inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        added
          ? "bg-green-600 text-white"
          : "bg-arena-500 text-white hover:bg-arena-600 active:scale-95",
        sizes[size],
        className,
      )}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          Agregado
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" />
          Agregar
        </>
      )}
    </button>
  );
}
