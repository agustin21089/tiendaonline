"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOrder, type CheckoutState } from "./actions";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Procesando...
        </>
      ) : (
        "Confirmar pedido"
      )}
    </Button>
  );
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300";

const labelClass = "block text-sm font-medium text-warm-700 mb-1";

const initialState: CheckoutState = {};

export function CheckoutForm() {
  const { items, subtotal } = useCart();
  const [state, formAction] = useActionState(createOrder, initialState);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-16 h-16 text-arena-200 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-light text-warm-800 mb-2">
          Tu carrito está vacío
        </h2>
        <p className="text-warm-400 mb-8">Agregá productos antes de continuar</p>
        <Button asChild>
          <Link href="/">Ver productos</Link>
        </Button>
      </div>
    );
  }

  const cartPayload = JSON.stringify(
    items.map((i) => ({
      productId: i.productId,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
    }))
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="cartItems" value={cartPayload} readOnly />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de contacto */}
          <section className="bg-white rounded-2xl border border-arena-200 p-6">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Datos de contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nombre completo *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className={inputClass}
                  placeholder="Juan García"
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className={inputClass}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  name="email"
                  className={inputClass}
                  placeholder="juan@ejemplo.com"
                />
              </div>
            </div>
          </section>

          {/* Dirección de envío */}
          <section className="bg-white rounded-2xl border border-arena-200 p-6">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Dirección de envío
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Calle y número *</label>
                <input
                  type="text"
                  name="address"
                  required
                  className={inputClass}
                  placeholder="Av. Corrientes 1234, Piso 3 Dpto B"
                />
              </div>
              <div>
                <label className={labelClass}>Ciudad *</label>
                <input
                  type="text"
                  name="city"
                  required
                  className={inputClass}
                  placeholder="Buenos Aires"
                />
              </div>
              <div>
                <label className={labelClass}>Provincia *</label>
                <input
                  type="text"
                  name="state"
                  required
                  className={inputClass}
                  placeholder="Buenos Aires"
                />
              </div>
              <div>
                <label className={labelClass}>Código postal *</label>
                <input
                  type="text"
                  name="zip"
                  required
                  className={inputClass}
                  placeholder="1043"
                />
              </div>
            </div>
          </section>

          {/* Método de pago */}
          <section className="bg-white rounded-2xl border border-arena-200 p-6">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Método de pago
            </h2>
            <div className="space-y-3">
              {[
                {
                  value: "efectivo",
                  label: "Efectivo al recibir",
                  desc: "Pagás cuando recibís tu pedido",
                },
                {
                  value: "transferencia",
                  label: "Transferencia bancaria",
                  desc: "Te enviamos los datos por WhatsApp",
                },
                {
                  value: "tarjeta_simulado",
                  label: "Tarjeta de crédito / débito",
                  desc: "Pago procesado en el siguiente paso (simulado)",
                },
              ].map((opt, idx) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 p-4 rounded-xl border border-arena-200 cursor-pointer hover:border-arena-400 has-[:checked]:border-arena-500 has-[:checked]:bg-arena-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    required
                    defaultChecked={idx === 0}
                    className="mt-0.5 accent-arena-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-warm-800">{opt.label}</p>
                    <p className="text-xs text-warm-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Notas */}
          <section className="bg-white rounded-2xl border border-arena-200 p-6">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-4">
              Notas adicionales
            </h2>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 resize-none placeholder:text-warm-300"
              placeholder="Instrucciones especiales para la entrega (opcional)"
            />
          </section>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
              {state.error}
            </div>
          )}
        </div>

        {/* Right column: order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-arena-200 p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Resumen
            </h2>
            <div className="space-y-3 text-sm mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-warm-600">
                  <span className="truncate flex-1 mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-arena-100 pt-3 flex justify-between font-semibold text-warm-900 text-base">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-warm-400">Envío a coordinar con el vendedor</p>
            </div>
            <SubmitButton />
            <Button variant="outline" className="w-full mt-2" size="sm" asChild>
              <Link href="/carrito">← Volver al carrito</Link>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
