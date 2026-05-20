import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "./order-actions";

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

interface Props {
  searchParams: Promise<{ estado?: string; pagina?: string; q?: string }>;
}

export default async function OrdenesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.pagina ?? 1);
  const perPage = 20;

  const where = {
    ...(params.estado ? { status: params.estado as never } : {}),
    ...(params.q
      ? {
          OR: [
            { shippingName: { contains: params.q, mode: "insensitive" as const } },
            { number: { equals: parseInt(params.q) || undefined } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { items: { take: 1 } },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Órdenes</h1>
        <p className="text-sm text-warm-500 mt-0.5">{total} órdenes</p>
      </div>

      <div className="bg-white rounded-xl border border-arena-200 overflow-hidden">
        {/* Filtros de estado */}
        <div className="px-4 py-3 border-b border-arena-100 flex flex-wrap gap-2">
          {["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
            (status) => (
              <a
                key={status}
                href={`/admin/ordenes${status ? `?estado=${status}` : ""}`}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  params.estado === status || (!params.estado && !status)
                    ? "bg-arena-600 text-white"
                    : "bg-arena-50 text-warm-600 hover:bg-arena-100"
                }`}
              >
                {status ? STATUS_LABELS[status] : "Todas"}
              </a>
            ),
          )}
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-arena-100 bg-arena-50">
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                #
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Cliente
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide text-right">
                Total
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Fecha
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-warm-400 text-sm">
                  No hay órdenes
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-arena-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-warm-800">
                    #{order.number}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-warm-800">{order.shippingName}</p>
                    <p className="text-xs text-warm-400">{order.shippingCity}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[order.status] ?? "default"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-warm-800">
                    {formatPrice(Number(order.total))}
                  </td>
                  <td className="px-4 py-3 text-sm text-warm-500">
                    {new Date(order.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <OrderActions order={order} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-arena-100 flex items-center justify-between">
            <p className="text-sm text-warm-500">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
            </p>
            <div className="flex gap-1">
              <a
                href={`/admin/ordenes?${new URLSearchParams({ ...params, pagina: String(page - 1) })}`}
                className={`px-3 py-1.5 rounded-lg text-sm border border-arena-200 ${page <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-arena-50"}`}
              >
                ← Anterior
              </a>
              <a
                href={`/admin/ordenes?${new URLSearchParams({ ...params, pagina: String(page + 1) })}`}
                className={`px-3 py-1.5 rounded-lg text-sm border border-arena-200 ${page >= totalPages ? "opacity-50 pointer-events-none" : "hover:bg-arena-50"}`}
              >
                Siguiente →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
