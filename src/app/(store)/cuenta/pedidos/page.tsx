import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
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

export default async function PedidosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/cuenta/pedidos");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 3 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Mis pedidos</h1>
        <p className="text-sm text-warm-500 mt-0.5">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-arena-200 py-16 text-center">
          <ShoppingBag className="w-12 h-12 text-arena-200 mx-auto mb-3" />
          <p className="text-warm-500 text-sm">Todavía no realizaste ningún pedido.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-arena-600 hover:underline font-medium">
            Ver productos →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-arena-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold text-warm-900">Pedido #{order.number}</p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-warm-100 text-warm-600"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-sm font-semibold text-warm-900">{formatPrice(Number(order.total))}</span>
                </div>
              </div>

              {/* Items preview */}
              <div className="text-sm text-warm-500 mb-3">
                {order.items.map((item) => (
                  <span key={item.id} className="after:content-[',_'] last:after:content-['']">
                    {item.name} ×{item.quantity}
                  </span>
                ))}
                {order.items.length === 3 && <span> y más...</span>}
              </div>

              <Link
                href={`/cuenta/pedidos/${order.id}`}
                className="text-xs font-medium text-arena-600 hover:underline"
              >
                Ver detalle →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
