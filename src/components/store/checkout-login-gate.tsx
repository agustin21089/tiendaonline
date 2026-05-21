"use client";

import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, User, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CheckoutLoginGate() {
  const { items, subtotal } = useCart();
  const count = items.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-light text-warm-900 mb-8">Finalizar compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Login / Register */}
        <div className="bg-white rounded-2xl border border-arena-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-arena-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-8 h-8 text-arena-600" />
          </div>
          <h2 className="font-display text-xl font-semibold text-warm-900 mb-2">
            ¡Ya casi terminás!
          </h2>
          <p className="text-warm-500 text-sm mb-6">
            Ingresá o registrate para finalizar tu compra. Tu carrito (
            {count} {count === 1 ? "producto" : "productos"} —{" "}
            <span className="font-semibold text-warm-700">{formatPrice(subtotal)}</span>
            ) estará guardado.
          </p>

          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/login?callbackUrl=/checkout">
                <User className="w-4 h-4 mr-2" />
                Ingresar con mi cuenta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/registro">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear una cuenta
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-5 border-t border-arena-100">
            <Link
              href="/checkout?guest=1"
              className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-700 transition-colors"
            >
              Continuar sin cuenta
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cart summary preview */}
        <div className="bg-white rounded-2xl border border-arena-200 p-6">
          <h3 className="font-display text-base font-semibold text-warm-900 mb-4">
            Tu carrito
          </h3>
          <div className="space-y-3 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-warm-600">
                <span className="truncate flex-1 mr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium text-warm-800">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-arena-100 pt-3 flex justify-between font-semibold text-warm-900 text-base">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4" size="sm" asChild>
            <Link href="/carrito">← Editar carrito</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
