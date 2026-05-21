import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reportes — Admin" };

async function getReportData() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const firstOfYear = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    thisMonthAgg,
    lastMonthAgg,
    yearAgg,
    allTimeAgg,
    salesByPayment,
    topProducts,
    ordersByStatus,
    couponStats,
  ] = await Promise.all([
    // This month
    prisma.order.aggregate({
      where: { createdAt: { gte: firstOfMonth }, paymentStatus: "APPROVED" },
      _sum: { total: true, discount: true, shipping: true },
      _count: true,
      _avg: { total: true },
    }),
    // Last month
    prisma.order.aggregate({
      where: {
        createdAt: { gte: firstOfLastMonth, lte: lastMonthEnd },
        paymentStatus: "APPROVED",
      },
      _sum: { total: true },
      _count: true,
    }),
    // Year
    prisma.order.aggregate({
      where: { createdAt: { gte: firstOfYear }, paymentStatus: "APPROVED" },
      _sum: { total: true },
      _count: true,
    }),
    // All time
    prisma.order.aggregate({
      where: { paymentStatus: "APPROVED" },
      _sum: { total: true },
      _count: true,
    }),
    // By payment method
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { paymentStatus: "APPROVED" },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
    }),
    // Top 10 products
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    // Orders by status
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
      orderBy: { _count: { status: "desc" } },
    }),
    // Coupon usage
    prisma.coupon.findMany({
      where: { usedCount: { gt: 0 } },
      orderBy: { usedCount: "desc" },
      take: 10,
      select: { code: true, type: true, value: true, usedCount: true },
    }),
  ]);

  // Monthly revenue for last 6 months
  const monthlyData: { label: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const agg = await prisma.order.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: "APPROVED",
      },
      _sum: { total: true },
      _count: true,
    });
    monthlyData.push({
      label: start.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      revenue: Number(agg._sum.total ?? 0),
      count: agg._count,
    });
  }

  return {
    thisMonthRevenue: Number(thisMonthAgg._sum.total ?? 0),
    thisMonthOrders: thisMonthAgg._count,
    thisMonthAvgOrder: Number(thisMonthAgg._avg.total ?? 0),
    thisMonthDiscount: Number(thisMonthAgg._sum.discount ?? 0),
    thisMonthShipping: Number(thisMonthAgg._sum.shipping ?? 0),
    lastMonthRevenue: Number(lastMonthAgg._sum.total ?? 0),
    lastMonthOrders: lastMonthAgg._count,
    yearRevenue: Number(yearAgg._sum.total ?? 0),
    yearOrders: yearAgg._count,
    allTimeRevenue: Number(allTimeAgg._sum.total ?? 0),
    allTimeOrders: allTimeAgg._count,
    salesByPayment,
    topProducts: topProducts.map((p) => ({
      name: p.name,
      quantity: p._sum.quantity ?? 0,
      orders: p._count,
    })),
    ordersByStatus,
    couponStats: couponStats.map((c) => ({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      usedCount: c.usedCount,
    })),
    monthlyData,
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "MercadoPago",
};

export default async function ReportesPage() {
  const data = await getReportData();

  const monthGrowth =
    data.lastMonthRevenue > 0
      ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
      : null;

  const maxMonthlyRevenue = Math.max(...data.monthlyData.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Reportes</h1>
        <p className="text-sm text-warm-500 mt-0.5">Análisis de ventas y rendimiento</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Este mes",
            value: formatPrice(data.thisMonthRevenue),
            sub: `${data.thisMonthOrders} órdenes`,
            badge:
              monthGrowth !== null
                ? {
                    text: `${monthGrowth >= 0 ? "+" : ""}${monthGrowth.toFixed(0)}% vs mes anterior`,
                    positive: monthGrowth >= 0,
                  }
                : null,
          },
          {
            label: "Mes anterior",
            value: formatPrice(data.lastMonthRevenue),
            sub: `${data.lastMonthOrders} órdenes`,
            badge: null,
          },
          {
            label: "Este año",
            value: formatPrice(data.yearRevenue),
            sub: `${data.yearOrders} órdenes`,
            badge: null,
          },
          {
            label: "Histórico",
            value: formatPrice(data.allTimeRevenue),
            sub: `${data.allTimeOrders} órdenes totales`,
            badge: null,
          },
        ].map(({ label, value, sub, badge }) => (
          <div key={label} className="bg-white rounded-xl border border-arena-200 p-5">
            <p className="text-sm text-warm-500">{label}</p>
            <p className="text-2xl font-semibold text-warm-900 mt-1">{value}</p>
            <p className="text-xs text-warm-400 mt-1">{sub}</p>
            {badge && (
              <span
                className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  badge.positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Monthly chart + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 6-month bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-arena-200 p-5">
          <h2 className="font-medium text-warm-800 mb-4">Ventas por mes (últimos 6 meses)</h2>
          <div className="flex items-end gap-3 h-40">
            {data.monthlyData.map((m, i) => {
              const barH = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-warm-500 font-medium">
                    {m.revenue > 0 ? formatPrice(m.revenue).replace("$", "").trim() : "—"}
                  </span>
                  <div className="w-full relative" style={{ height: "100px" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-arena-400 transition-all"
                      style={{ height: `${Math.max(barH, m.revenue > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-warm-400">{m.label}</span>
                  <span className="text-xs text-warm-300">{m.count} ord.</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* This month breakdown */}
        <div className="bg-white rounded-xl border border-arena-200 p-5">
          <h2 className="font-medium text-warm-800 mb-4">Desglose del mes</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-500">Subtotal bruto</span>
              <span className="font-medium text-warm-800">
                {formatPrice(data.thisMonthRevenue + data.thisMonthDiscount - data.thisMonthShipping)}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Descuentos (cupones)</span>
              <span>-{formatPrice(data.thisMonthDiscount)}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Ingresos por envío</span>
              <span>+{formatPrice(data.thisMonthShipping)}</span>
            </div>
            <div className="border-t border-arena-100 pt-2 flex justify-between font-semibold text-warm-900">
              <span>Total neto</span>
              <span>{formatPrice(data.thisMonthRevenue)}</span>
            </div>
            <div className="flex justify-between text-warm-400 text-xs">
              <span>Ticket promedio</span>
              <span>
                {data.thisMonthOrders > 0 ? formatPrice(data.thisMonthAvgOrder) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top products + Orders by status + Payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-arena-200 p-5">
          <h2 className="font-medium text-warm-800 mb-4">Top 10 productos</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-warm-400">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2.5">
              {data.topProducts.map((p, i) => {
                const maxQty = data.topProducts[0]?.quantity ?? 1;
                const pct = (p.quantity / maxQty) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-warm-700 truncate flex-1 mr-2">
                        <span className="text-warm-300 text-xs mr-1.5">#{i + 1}</span>
                        {p.name}
                      </span>
                      <span className="text-warm-500 shrink-0">{p.quantity} ud.</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-arena-100">
                      <div
                        className="h-1.5 rounded-full bg-arena-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-xl border border-arena-200 p-5">
          <h2 className="font-medium text-warm-800 mb-4">Órdenes por estado</h2>
          {data.ordersByStatus.length === 0 ? (
            <p className="text-sm text-warm-400">Sin órdenes</p>
          ) : (
            <div className="space-y-2">
              {data.ordersByStatus.map((s) => {
                const max = data.ordersByStatus[0]?._count ?? 1;
                const pct = (s._count / max) * 100;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-warm-700">
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                      <span className="text-warm-500">{s._count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-arena-100">
                      <div
                        className="h-1.5 rounded-full bg-arena-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment methods + Coupon usage */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-arena-200 p-5">
            <h2 className="font-medium text-warm-800 mb-4">Métodos de pago</h2>
            {data.salesByPayment.length === 0 ? (
              <p className="text-sm text-warm-400">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {data.salesByPayment.map((p) => (
                  <div key={p.paymentMethod} className="flex justify-between text-sm">
                    <span className="text-warm-600">
                      {PAYMENT_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "—"}
                    </span>
                    <div className="text-right">
                      <span className="font-medium text-warm-800">
                        {formatPrice(Number(p._sum.total ?? 0))}
                      </span>
                      <span className="text-warm-400 ml-1.5 text-xs">{p._count} órd.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.couponStats.length > 0 && (
            <div className="bg-white rounded-xl border border-arena-200 p-5">
              <h2 className="font-medium text-warm-800 mb-4">Cupones usados</h2>
              <div className="space-y-2">
                {data.couponStats.map((c) => (
                  <div key={c.code} className="flex justify-between text-sm">
                    <code className="font-mono text-xs font-bold bg-arena-50 px-1.5 py-0.5 rounded text-warm-800">
                      {c.code}
                    </code>
                    <span className="text-warm-500">
                      {c.usedCount} uso{c.usedCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
