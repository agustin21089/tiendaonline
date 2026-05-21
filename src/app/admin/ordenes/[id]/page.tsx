import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrderDetailActions } from "./order-detail-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Detalle de orden" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "default",
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo al recibir",
  transferencia: "Transferencia bancaria",
  tarjeta_simulado: "Tarjeta (simulado)",
};

export default async function OrdenDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ordenes"
          className="p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-arena-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold text-warm-900">
            Orden #{order.number}
          </h1>
          <p className="text-sm text-warm-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[order.status] ?? "default"}>
          {STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items + summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-xl border border-arena-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-arena-100">
              <h2 className="font-medium text-warm-800">Productos</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-arena-50 bg-arena-50 text-xs text-warm-500 uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-semibold">Producto</th>
                  <th className="px-5 py-2.5 text-center font-semibold">Cant.</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Precio unit.</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-sm text-warm-800">{item.name}</td>
                    <td className="px-5 py-3 text-sm text-warm-600 text-center">{item.quantity}</td>
                    <td className="px-5 py-3 text-sm text-warm-700 text-right">
                      {formatPrice(Number(item.price))}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-warm-900 text-right">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div className="px-5 py-4 border-t border-arena-100 space-y-1.5">
              <div className="flex justify-between text-sm text-warm-600">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {Number(order.shipping) > 0 && (
                <div className="flex justify-between text-sm text-warm-600">
                  <span>Envío</span>
                  <span>{formatPrice(Number(order.shipping))}</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Descuento</span>
                  <span>-{formatPrice(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-warm-900 text-base pt-1.5 border-t border-arena-100">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-arena-200 px-5 py-4">
              <h2 className="font-medium text-warm-800 mb-2">Notas</h2>
              <p className="text-sm text-warm-600 whitespace-pre-line">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right: customer + actions */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-arena-200 px-5 py-4">
            <h2 className="font-medium text-warm-800 mb-3">Cliente</h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-warm-900">{order.shippingName}</p>
              {order.shippingPhone && <p className="text-warm-600">{order.shippingPhone}</p>}
              {order.user?.email && <p className="text-warm-400">{order.user.email}</p>}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-arena-200 px-5 py-4">
            <h2 className="font-medium text-warm-800 mb-3">Dirección de envío</h2>
            <div className="text-sm text-warm-600 space-y-0.5">
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState}</p>
              <p>CP {order.shippingZip}</p>
            </div>
            {order.trackingNumber && (
              <div className="mt-3 pt-3 border-t border-arena-100">
                <p className="text-xs text-warm-500">Número de seguimiento</p>
                <p className="text-sm font-medium text-warm-800">{order.trackingNumber}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-arena-200 px-5 py-4">
            <h2 className="font-medium text-warm-800 mb-3">Pago</h2>
            <div className="space-y-1 text-sm">
              <p className="text-warm-700">
                {order.paymentMethod
                  ? (PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)
                  : "—"}
              </p>
              {order.paymentRef && (
                <p className="text-xs text-warm-400">Ref: {order.paymentRef}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-arena-200 px-5 py-4">
            <h2 className="font-medium text-warm-800 mb-3">Cambiar estado</h2>
            <OrderDetailActions order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}
