"use client";

import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CarritoPage() {
  const { items, subtotal, update, remove, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-arena-200 mx-auto mb-4" />
        <h1 className="font-display text-3xl font-light text-warm-800 mb-2">Tu carrito está vacío</h1>
        <p className="text-warm-400 mb-8">Explorá nuestros productos y encontrá algo que te guste</p>
        <Button asChild size="lg">
          <Link href="/">Ver productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-light text-warm-900 mb-8">Tu carrito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-2xl border border-arena-200 p-4 flex gap-4"
            >
              {/* Imagen */}
              <Link href={`/producto/${item.slug}`} className="shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-arena-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-arena-100" />
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/producto/${item.slug}`}>
                  <h3 className="text-sm font-medium text-warm-800 hover:text-arena-600 transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-base font-semibold text-warm-900 mt-1">
                  {formatPrice(item.price)}
                </p>

                <div className="flex items-center justify-between mt-3">
                  {/* Cantidad */}
                  <div className="flex items-center border border-arena-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => update(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => update(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-warm-800">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => remove(item.productId)}
                      className="p-1.5 text-warm-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clear}
            className="text-sm text-warm-400 hover:text-red-500 transition-colors mt-2"
          >
            Vaciar carrito
          </button>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-arena-200 p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Resumen del pedido
            </h2>

            <div className="space-y-3 text-sm">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-warm-600">
                  <span className="truncate flex-1 mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}

              <div className="border-t border-arena-100 pt-3 mt-3 flex justify-between font-semibold text-warm-900 text-base">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-warm-400">Envío calculado en el próximo paso</p>
            </div>

            <Button className="w-full mt-6" size="lg" asChild>
              <Link href="/checkout">Continuar al pago →</Link>
            </Button>
            <Button variant="outline" className="w-full mt-2" size="sm" asChild>
              <Link href="/">Seguir comprando</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
