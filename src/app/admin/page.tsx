import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOrders,
    pendingOrders,
    monthOrders,
    totalProducts,
    lowStockProducts,
    totalCustomers,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: firstOfMonth }, paymentStatus: "APPROVED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { stock: { lte: 5 }, trackStock: true, active: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    monthRevenue: monthOrders._sum.total ?? 0,
    monthOrdersCount: monthOrders._count,
    totalProducts,
    lowStockProducts,
    totalCustomers,
  };
}

async function getRecentOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: { take: 1 } },
  });
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([getStats(), getRecentOrders()]);

  const statCards = [
    {
      label: "Ventas del mes",
      value: formatPrice(Number(stats.monthRevenue)),
      sub: `${stats.monthOrdersCount} órdenes`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Órdenes pendientes",
      value: stats.pendingOrders.toString(),
      sub: `${stats.totalOrders} total`,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      label: "Productos activos",
      value: stats.totalProducts.toString(),
      sub: stats.lowStockProducts > 0 ? `${stats.lowStockProducts} con stock bajo` : "Stock OK",
      icon: Package,
      color: stats.lowStockProducts > 0 ? "text-red-600 bg-red-50" : "text-arena-600 bg-arena-50",
    },
    {
      label: "Clientes",
      value: stats.totalCustomers.toString(),
      sub: "registrados",
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    PROCESSING: "En proceso",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    PENDING: "text-yellow-700 bg-yellow-50",
    CONFIRMED: "text-blue-700 bg-blue-50",
    PROCESSING: "text-purple-700 bg-purple-50",
    SHIPPED: "text-indigo-700 bg-indigo-50",
    DELIVERED: "text-green-700 bg-green-50",
    CANCELLED: "text-red-700 bg-red-50",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Dashboard</h1>
        <p className="text-sm text-warm-500 mt-0.5">Resumen general de tu tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-arena-200 p-5">
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
          </div>
        ))}
      </div>

      {/* Stock bajo */}
      {stats.lowStockProducts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{stats.lowStockProducts} productos</strong> tienen stock bajo (≤5 unidades).{" "}
            <a href="/admin/productos?stockBajo=1" className="underline font-medium">
              Ver productos →
            </a>
          </p>
        </div>
      )}

      {/* Órdenes recientes */}
      <div className="bg-white rounded-xl border border-arena-200">
        <div className="px-6 py-4 border-b border-arena-100 flex items-center justify-between">
          <h2 className="font-medium text-warm-800">Órdenes recientes</h2>
          <a href="/admin/ordenes" className="text-sm text-arena-600 hover:text-arena-700 font-medium">
            Ver todas →
          </a>
        </div>
        <div className="divide-y divide-arena-50">
          {recentOrders.length === 0 ? (
            <p className="text-center text-warm-400 py-8 text-sm">No hay órdenes aún</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-3.5 flex items-center gap-4">
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
