"use client";

import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { items, count, subtotal, remove, update, closeCart, isOpen } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-arena-100">
          <h2 className="font-display text-lg font-semibold text-warm-900">
            Tu carrito ({count})
          </h2>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-arena-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-warm-400">
              <ShoppingBag className="w-12 h-12 text-arena-200" />
              <p className="text-sm">Tu carrito está vacío</p>
              <Button variant="outline" size="sm" onClick={closeCart} asChild>
                <Link href="/">Ver productos</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-arena-50 px-5">
              {items.map((item) => (
                <li key={item.productId} className="py-4 flex gap-3">
                  {/* Imagen */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-arena-100 shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-arena-100" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-warm-800 hover:text-arena-600 line-clamp-2 leading-snug"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm font-semibold text-warm-900 mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Cantidad */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-arena-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => update(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-warm-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => update(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-7 h-7 flex items-center justify-center text-warm-500 hover:bg-arena-50 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.productId)}
                        className="text-xs text-warm-400 hover:text-red-500 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-warm-800">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-arena-100 px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-warm-600">Subtotal</span>
              <span className="font-semibold text-warm-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-warm-400">Envío calculado en el checkout</p>
            <Button className="w-full" size="lg" asChild onClick={closeCart}>
              <Link href="/checkout">Continuar al pago →</Link>
            </Button>
            <Button variant="outline" className="w-full" size="sm" asChild onClick={closeCart}>
              <Link href="/carrito">Ver carrito completo</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
