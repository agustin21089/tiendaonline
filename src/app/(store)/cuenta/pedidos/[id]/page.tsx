import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente de pago",
  CONFIRMED: "Confirmado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-warm-100 text-warm-600",
};

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });

  if (!order || order.userId !== session.user.id) notFound();

  const paymentLabel: Record<string, string> = {
    efectivo: "Efectivo al recibir",
    transferencia: "Transferencia bancaria",
    mercadopago: "MercadoPago",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cuenta/pedidos" className="p-2 rounded-lg hover:bg-arena-50 text-warm-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Pedido #{order.number}</h1>
          <p className="text-sm text-warm-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-warm-100 text-warm-600"}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Items */}
      <section className="bg-white rounded-2xl border border-arena-200 p-6">
        <h2 className="text-sm font-semibold text-warm-800 mb-4">Productos</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-warm-700">{item.name} <span className="text-warm-400">×{item.quantity}</span></span>
              <span className="font-medium text-warm-900">{formatPrice(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-arena-100 mt-4 pt-4 flex justify-between font-semibold text-warm-900">
          <span>Total</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Envío */}
        <section className="bg-white rounded-2xl border border-arena-200 p-6">
          <h2 className="text-sm font-semibold text-warm-800 mb-3">Datos de envío</h2>
          <div className="text-sm text-warm-600 space-y-0.5">
            <p className="font-medium text-warm-800">{order.shippingName}</p>
            {order.shippingPhone && <p>{order.shippingPhone}</p>}
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
          </div>
          {order.trackingNumber && (
            <div className="mt-3 pt-3 border-t border-arena-100">
              <p className="text-xs text-warm-500">Número de seguimiento</p>
              <p className="text-sm font-mono font-medium text-warm-800">{order.trackingNumber}</p>
            </div>
          )}
        </section>

        {/* Pago */}
        <section className="bg-white rounded-2xl border border-arena-200 p-6">
          <h2 className="text-sm font-semibold text-warm-800 mb-3">Pago</h2>
          <p className="text-sm text-warm-600">
            {order.paymentMethod ? (paymentLabel[order.paymentMethod] ?? order.paymentMethod) : "—"}
          </p>
          <div className="mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              order.paymentStatus === "APPROVED" ? "bg-green-100 text-green-700" :
              order.paymentStatus === "REJECTED" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {order.paymentStatus === "APPROVED" ? "Pago acreditado" :
               order.paymentStatus === "REJECTED" ? "Rechazado" : "Pendiente"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
