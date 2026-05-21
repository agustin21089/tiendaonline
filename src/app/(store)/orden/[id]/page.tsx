import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClearCart } from "./clear-cart";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export const metadata: Metadata = {
  title: "Pedido confirmado",
};

const paymentLabels: Record<string, string> = {
  efectivo: "Efectivo al recibir",
  transferencia: "Transferencia bancaria",
  mercadopago: "MercadoPago",
};

const paymentInstructions: Record<string, string> = {
  efectivo:
    "Pagarás cuando recibas tu pedido. Nos pondremos en contacto para coordinar la entrega.",
  transferencia:
    "Te enviaremos los datos bancarios por WhatsApp para que realices la transferencia antes del envío.",
  mercadopago: "Tu pago fue procesado a través de MercadoPago.",
};

type PaymentResult = "approved" | "rejected" | "pending" | null;

function PaymentBanner({ result }: { result: PaymentResult }) {
  if (!result) return null;

  if (result === "approved") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800">Pago aprobado</p>
          <p className="text-sm text-green-700 mt-0.5">
            Tu pago fue acreditado exitosamente. Ya estamos preparando tu pedido.
          </p>
        </div>
      </div>
    );
  }

  if (result === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-5 flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-800">Pago pendiente</p>
          <p className="text-sm text-yellow-700 mt-0.5">
            Tu pago está siendo procesado. Te avisaremos cuando se acredite.
          </p>
        </div>
      </div>
    );
  }

  if (result === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">Pago rechazado</p>
          <p className="text-sm text-red-700 mt-0.5">
            No se pudo procesar tu pago. Podés intentarlo de nuevo o elegir otro método.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/checkout">Reintentar pago</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export default async function OrdenPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { payment } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const paymentResult = (["approved", "rejected", "pending"].includes(payment ?? "")
    ? payment
    : null) as PaymentResult;

  const shouldClearCart = paymentResult !== "rejected";
  const instruction = order.paymentMethod ? paymentInstructions[order.paymentMethod] : null;
  const isRejected = paymentResult === "rejected";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {shouldClearCart && <ClearCart />}

      {/* Header */}
      <div className="text-center mb-10">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isRejected ? "bg-red-50" : "bg-green-50"
          }`}
        >
          {isRejected ? (
            <XCircle className="w-10 h-10 text-red-400" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          )}
        </div>
        <h1 className="font-display text-3xl font-light text-warm-900 mb-2">
          {isRejected ? "Pago no procesado" : "¡Pedido recibido!"}
        </h1>
        <p className="text-warm-500">
          Número de pedido:{" "}
          <span className="font-semibold text-warm-800">#{order.number}</span>
        </p>
      </div>

      {/* Banner de resultado de pago MP */}
      <PaymentBanner result={paymentResult} />

      {/* Instrucciones de pago para métodos no-MP */}
      {instruction && !paymentResult && (
        <div className="bg-arena-50 border border-arena-200 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold text-arena-600 uppercase tracking-wide mb-1">
            {order.paymentMethod ? paymentLabels[order.paymentMethod] : "Pago"}
          </p>
          <p className="text-sm text-warm-700">{instruction}</p>
        </div>
      )}

      {/* Detalle del pedido */}
      <div className="bg-white rounded-2xl border border-arena-200 p-6 mb-5">
        <h2 className="font-display text-base font-semibold text-warm-900 mb-4">
          Detalle del pedido
        </h2>
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-warm-600">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium text-warm-900">
                {formatPrice(Number(item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-arena-100 pt-3 flex justify-between font-semibold text-warm-900">
          <span>Total</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </div>

      {/* Datos de envío */}
      <div className="bg-white rounded-2xl border border-arena-200 p-6 mb-8">
        <h2 className="font-display text-base font-semibold text-warm-900 mb-3">
          Datos de envío
        </h2>
        <div className="text-sm text-warm-600 space-y-0.5">
          <p className="font-medium text-warm-800">{order.shippingName}</p>
          {order.shippingPhone && <p>{order.shippingPhone}</p>}
          <p>{order.shippingAddress}</p>
          <p>
            {order.shippingCity}, {order.shippingState} {order.shippingZip}
          </p>
        </div>
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link href="/">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  );
}
