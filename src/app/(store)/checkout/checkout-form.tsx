"use client";

import { useActionState, useEffect, useState, useCallback, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createOrder, validateCoupon, getShippingOptions, reserveStock, type CheckoutState } from "./actions";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag, Loader2, Tag, Truck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { ShippingOption } from "@/lib/shipping";

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

const PAYMENT_OPTIONS = [
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
    value: "mercadopago",
    label: "MercadoPago",
    desc: "Tarjeta de crédito, débito, dinero en cuenta o Rapipago",
  },
];

type DefaultValues = {
  name?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  address?: string | null | undefined;
  city?: string | null | undefined;
  state?: string | null | undefined;
  zip?: string | null | undefined;
} | null;

export function CheckoutForm({ defaultValues }: { defaultValues?: DefaultValues }) {
  const { items, subtotal } = useCart();
  const [state, formAction] = useActionState(createOrder, initialState);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Stock reservation
  const reservationId = useRef<string>("");
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const reservedRef = useRef(false);

  // Shipping state
  const [zipValue, setZipValue] = useState(defaultValues?.zip ?? "");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingFree, setShippingFree] = useState(false);

  useEffect(() => {
    if (state.mpUrl) {
      window.location.href = state.mpUrl;
    }
  }, [state.mpUrl]);

  // Reserve stock when checkout loads (once, after cart items are available)
  useEffect(() => {
    if (reservedRef.current || items.length === 0) return;
    reservedRef.current = true;

    // Generate a stable session ID for this checkout flow (stored in sessionStorage)
    let sid = sessionStorage.getItem("checkoutSession");
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
      sessionStorage.setItem("checkoutSession", sid);
    }
    reservationId.current = sid;

    reserveStock(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      sid
    ).then((result) => {
      if (!result.ok) {
        setStockWarning(result.error);
      }
    }).catch(() => {/* reservation is best-effort */});
  }, [items]);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(couponInput, subtotal);
      if (result.ok) {
        setCouponApplied({ code: couponInput.toUpperCase(), discount: result.discount, label: result.label });
        setCouponError(null);
      } else {
        setCouponError(result.error);
        setCouponApplied(null);
      }
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponApplied(null);
    setCouponInput("");
    setCouponError(null);
  }

  const fetchShipping = useCallback(async (zip: string) => {
    if (zip.length < 4) return;
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShipping(null);
    try {
      const result = await getShippingOptions(zip, subtotal);
      if (result.ok) {
        setShippingOptions(result.options);
        setShippingFree(result.free);
        setSelectedShipping(result.options[0] ?? null);
      } else {
        setShippingError(result.error);
      }
    } finally {
      setShippingLoading(false);
    }
  }, [subtotal]);

  const discount = couponApplied?.discount ?? 0;
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const total = Math.max(0, subtotal - discount) + shippingCost;

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
      {couponApplied && (
        <input type="hidden" name="couponCode" value={couponApplied.code} readOnly />
      )}
      {selectedShipping && (
        <>
          <input type="hidden" name="shippingOptionId" value={selectedShipping.id} readOnly />
          <input type="hidden" name="shippingPrice" value={selectedShipping.price} readOnly />
        </>
      )}
      <input type="hidden" name="reservationSessionId" value={reservationId.current} readOnly />

      {/* Stock warning */}
      {stockWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Stock insuficiente</p>
            <p className="text-sm text-yellow-700 mt-0.5">{stockWarning}. Modificá tu carrito antes de continuar.</p>
          </div>
        </div>
      )}

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
                  defaultValue={defaultValues?.name ?? ""}
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
                  defaultValue={defaultValues?.phone ?? ""}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  name="email"
                  className={inputClass}
                  placeholder="juan@ejemplo.com"
                  defaultValue={defaultValues?.email ?? ""}
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
                  defaultValue={defaultValues?.address ?? ""}
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
                  defaultValue={defaultValues?.city ?? ""}
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
                  defaultValue={defaultValues?.state ?? ""}
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
                  value={zipValue}
                  onChange={(e) => setZipValue(e.target.value)}
                  onBlur={(e) => fetchShipping(e.target.value)}
                />
              </div>
            </div>

            {/* Shipping options — shown after zip is entered */}
            {(shippingLoading || shippingOptions.length > 0 || shippingError) && (
              <div className="mt-5 pt-5 border-t border-arena-100">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-arena-500" />
                  <h3 className="text-sm font-semibold text-warm-800">Opciones de envío — Andreani</h3>
                  {shippingFree && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      ¡Envío gratis disponible!
                    </span>
                  )}
                </div>

                {shippingLoading && (
                  <div className="flex items-center gap-2 text-sm text-warm-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Calculando tarifas...
                  </div>
                )}

                {shippingError && (
                  <p className="text-sm text-red-600">{shippingError}</p>
                )}

                {shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                          border-arena-200 hover:border-arena-400
                          has-[:checked]:border-arena-500 has-[:checked]:bg-arena-50"
                      >
                        <input
                          type="radio"
                          name="shippingSelect"
                          value={opt.id}
                          checked={selectedShipping?.id === opt.id}
                          onChange={() => setSelectedShipping(opt)}
                          className="accent-arena-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-warm-800">{opt.name}</p>
                          <p className="text-xs text-warm-400">
                            {opt.zone} · {opt.days}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-warm-900 shrink-0">
                          {opt.price === 0 ? (
                            <span className="text-green-600">Gratis</span>
                          ) : (
                            formatPrice(opt.price)
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Método de pago */}
          <section className="bg-white rounded-2xl border border-arena-200 p-6">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Método de pago
            </h2>
            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((opt, idx) => (
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warm-800">{opt.label}</p>
                    <p className="text-xs text-warm-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {opt.value === "mercadopago" && (
                    <svg viewBox="0 0 72 24" className="h-5 shrink-0 mt-0.5" fill="none">
                      <path
                        d="M10.8 0C4.84 0 0 4.84 0 10.8c0 5.96 4.84 10.8 10.8 10.8 2.44 0 4.68-.82 6.5-2.18l-3.32-3.32A5.94 5.94 0 0110.8 17.4a5.97 5.97 0 01-5.97-5.97A5.97 5.97 0 0110.8 5.46c1.96 0 3.68.94 4.77 2.39l3.38-3.38A10.74 10.74 0 0010.8 0z"
                        fill="#009EE3"
                      />
                      <path
                        d="M21.6 10.44l-3.65-3.65A5.94 5.94 0 0116.77 7.85l3.32 3.32a5.94 5.94 0 01-1.29 1.28l3.65 3.65A10.74 10.74 0 0024 10.8c0-.12-.01-.24-.02-.36z"
                        fill="#00B1EA"
                      />
                      <text x="28" y="16" fontFamily="Arial" fontSize="11" fontWeight="bold" fill="#009EE3">
                        MercadoPago
                      </text>
                    </svg>
                  )}
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

          {state?.mpUrl && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              Redirigiendo a MercadoPago...
            </div>
          )}
        </div>

        {/* Right column: order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-arena-200 p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-warm-900 mb-5">
              Resumen
            </h2>

            {/* Items */}
            <div className="space-y-2 text-sm mb-5">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-warm-600">
                  <span className="truncate flex-1 mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="border-t border-arena-100 pt-4 mb-4">
              <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Cupón de descuento
              </p>

              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-700">{couponApplied.code}</p>
                      <p className="text-xs text-green-600">{couponApplied.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-warm-400 hover:text-red-500 transition-colors"
                    title="Quitar cupón"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                    placeholder="CÓDIGO"
                    className="flex-1 h-9 px-3 rounded-lg border border-arena-200 text-sm font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300"
                    maxLength={30}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="shrink-0"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {couponError}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-arena-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-warm-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Descuento ({couponApplied?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-warm-600">
                <span>Envío</span>
                {selectedShipping ? (
                  shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Gratis</span>
                  ) : (
                    <span>{formatPrice(shippingCost)}</span>
                  )
                ) : (
                  <span className="text-warm-300 text-xs italic">Ingresá tu CP</span>
                )}
              </div>

              <div className="border-t border-arena-100 pt-2 flex justify-between font-semibold text-warm-900 text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <SubmitButton />
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link href="/carrito">← Volver al carrito</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
