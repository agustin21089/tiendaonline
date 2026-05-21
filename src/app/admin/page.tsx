import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Tag,
  ArrowRight,
} from "lucide-react";

async function getStats() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    monthOrders,
    todayOrders,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCustomers,
    newCustomersMonth,
    activeCoupons,
    last30DaysOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: firstOfMonth }, paymentStatus: "APPROVED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { stock: { lte: 5, gt: 0 }, trackStock: true, active: true } }),
    prisma.product.count({ where: { stock: 0, trackStock: true, active: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: firstOfMonth } } }),
    prisma.coupon.count({ where: { active: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, total: true, paymentStatus: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    monthRevenue: Number(monthOrders._sum.total ?? 0),
    monthOrdersCount: monthOrders._count,
    todayRevenue: Number(todayOrders._sum.total ?? 0),
    todayOrdersCount: todayOrders._count,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCustomers,
    newCustomersMonth,
    activeCoupons,
    last30DaysOrders,
  };
}

async function getTopProducts() {
  const items = await prisma.orderItem.groupBy({
    by: ["productId", "name"],
    _sum: { quantity: true },
    _count: true,
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });
  return items.map((i) => ({
    productId: i.productId,
    name: i.name,
    quantity: i._sum.quantity ?? 0,
    orders: i._count,
  }));
}

async function getRecentOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

// Build a 30-day revenue array grouped by day
function buildDailyRevenue(
  orders: { createdAt: Date; total: unknown; paymentStatus: string }[]
) {
  const days: { label: string; revenue: number; count: number }[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    days.push({ label: key, revenue: 0, count: 0 });
  }

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays >= 0 && diffDays < 30) {
      const idx = 29 - diffDays;
      if (days[idx]) {
        days[idx].revenue += Number(order.total);
        days[idx].count += 1;
      }
    }
  }

  return days;
}

// Simple SVG bar chart
function RevenueChart({
  days,
}: {
  days: { label: string; revenue: number; count: number }[];
}) {
  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);
  const width = 100;
  const height = 60;
  const barCount = days.length;
  const barWidth = (width / barCount) * 0.6;
  const barGap = width / barCount;

  // Only show every 5th label to avoid clutter
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32"
        preserveAspectRatio="none"
      >
        {days.map((d, i) => {
          const barH = Math.max((d.revenue / maxRevenue) * (height - 8), d.revenue > 0 ? 2 : 0);
          const x = i * barGap + (barGap - barWidth) / 2;
          const y = height - barH;
          const hasRevenue = d.revenue > 0;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={1}
                fill={hasRevenue ? "#C49A62" : "#F3EDE4"}
              />
            </g>
          );
        })}
      </svg>

      {/* X-axis labels — show first, middle and last */}
      <div className="flex justify-between text-xs text-warm-400 mt-1 px-0.5">
        <span>{days[0]?.label}</span>
        <span>{days[14]?.label}</span>
        <span>{days[29]?.label}</span>
      </div>
    </div>
  );
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-50",
  CONFIRMED: "text-blue-700 bg-blue-50",
  PROCESSING: "text-purple-700 bg-purple-50",
  SHIPPED: "text-indigo-700 bg-indigo-50",
  DELIVERED: "text-green-700 bg-green-50",
  CANCELLED: "text-red-700 bg-red-50",
  REFUNDED: "text-warm-600 bg-warm-100",
};

export default async function AdminDashboard() {
  const [stats, topProducts, recentOrders] = await Promise.all([
    getStats(),
    getTopProducts(),
    getRecentOrders(),
  ]);

  const dailyRevenue = buildDailyRevenue(stats.last30DaysOrders);

  const statCards = [
    {
      label: "Ventas del mes",
      value: formatPrice(stats.monthRevenue),
      sub: `${stats.monthOrdersCount} órdenes aprobadas`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
      href: "/admin/ordenes",
    },
    {
      label: "Pendientes",
      value: stats.pendingOrders.toString(),
      sub: `${stats.totalOrders} total acumulado`,
      icon: Clock,
      color: stats.pendingOrders > 0 ? "text-yellow-600 bg-yellow-50" : "text-warm-400 bg-warm-50",
      href: "/admin/ordenes?estado=PENDING",
    },
    {
      label: "Productos activos",
      value: stats.totalProducts.toString(),
      sub:
        stats.outOfStockProducts > 0
          ? `${stats.outOfStockProducts} sin stock`
          : stats.lowStockProducts > 0
          ? `${stats.lowStockProducts} con stock bajo`
          : "Stock OK",
      icon: Package,
      color:
        stats.outOfStockProducts > 0
          ? "text-red-600 bg-red-50"
          : stats.lowStockProducts > 0
          ? "text-yellow-600 bg-yellow-50"
          : "text-arena-600 bg-arena-50",
      href: "/admin/productos",
    },
    {
      label: "Clientes",
      value: stats.totalCustomers.toString(),
      sub: `+${stats.newCustomersMonth} este mes`,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
      href: "/admin/clientes",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Dashboard</h1>
          <p className="text-sm text-warm-500 mt-0.5">
            Hoy: {stats.todayOrdersCount} órdenes ·{" "}
            {stats.todayRevenue > 0 ? formatPrice(stats.todayRevenue) : "sin ventas aún"}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-arena-200 p-5 hover:border-arena-400 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-warm-500">{label}</p>
                <p className="text-2xl font-semibold text-warm-900 mt-1">{value}</p>
                <p className="text-xs text-warm-400 mt-1">{sub}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(stats.outOfStockProducts > 0 || stats.lowStockProducts > 0) && (
        <div className="space-y-2">
          {stats.outOfStockProducts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 flex-1">
                <strong>{stats.outOfStockProducts} productos</strong> sin stock —{" "}
                <Link href="/admin/productos" className="underline font-medium">
                  Gestionar stock →
                </Link>
              </p>
            </div>
          )}
          {stats.lowStockProducts > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700 flex-1">
                <strong>{stats.lowStockProducts} productos</strong> con stock bajo (≤5 ud.) —{" "}
                <Link href="/admin/productos" className="underline font-medium">
                  Ver productos →
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Revenue chart + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-arena-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-warm-800">Ventas — últimos 30 días</h2>
            <span className="text-xs text-warm-400">
              {stats.last30DaysOrders.length} órdenes
            </span>
          </div>
          <RevenueChart days={dailyRevenue} />
        </div>

        {/* Top products */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-arena-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-warm-800">Más vendidos</h2>
            <Link
              href="/admin/productos"
              className="text-xs text-arena-600 hover:text-arena-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-4">Sin ventas aún</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-warm-300 w-4 shrink-0">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-sm text-warm-700 truncate">{p.name}</p>
                  <span className="text-xs font-semibold text-arena-600 shrink-0">
                    ×{p.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-arena-200">
          <div className="px-6 py-4 border-b border-arena-100 flex items-center justify-between">
            <h2 className="font-medium text-warm-800">Órdenes recientes</h2>
            <Link href="/admin/ordenes" className="text-sm text-arena-600 hover:text-arena-700 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-arena-50">
            {recentOrders.length === 0 ? (
              <p className="text-center text-warm-400 py-8 text-sm">No hay órdenes aún</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/ordenes/${order.id}`}
                  className="px-6 py-3 flex items-center gap-4 hover:bg-warm-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-warm-800">#{order.number}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] ?? "bg-warm-100 text-warm-600"}`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400 mt-0.5 truncate">{order.shippingName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-warm-800">
                      {formatPrice(Number(order.total))}
                    </p>
                    <p className="text-xs text-warm-400">
                      {new Date(order.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-arena-200 p-5">
            <h2 className="font-medium text-warm-800 mb-3">Acceso rápido</h2>
            <div className="space-y-2">
              {[
                { href: "/admin/productos/nuevo", label: "Agregar producto", icon: Package },
                { href: "/admin/cupones", label: `Cupones activos (${stats.activeCoupons})`, icon: Tag },
                { href: "/admin/categorias", label: "Gestionar categorías", icon: ShoppingCart },
                { href: "/admin/banners", label: "Editar banners", icon: TrendingUp },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-warm-700 hover:bg-arena-50 hover:text-arena-700 transition-colors"
                >
                  <Icon className="w-4 h-4 text-warm-400" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Coupon mini-stat */}
          <div className="bg-arena-50 rounded-xl border border-arena-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-arena-600" />
              <h3 className="text-sm font-medium text-arena-800">Cupones</h3>
            </div>
            <p className="text-2xl font-semibold text-arena-700">{stats.activeCoupons}</p>
            <p className="text-xs text-arena-600 mt-0.5">activos en este momento</p>
            <Link
              href="/admin/cupones"
              className="mt-3 text-xs text-arena-600 hover:text-arena-800 underline block"
            >
              Gestionar cupones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
