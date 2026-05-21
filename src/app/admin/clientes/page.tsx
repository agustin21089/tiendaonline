import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.pagina ?? 1);
  const perPage = 25;
  const q = params.q?.trim();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { total: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Clientes</h1>
          <p className="text-sm text-warm-500 mt-0.5">{total} registrados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-arena-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 text-warm-400">
            <Users className="w-10 h-10 text-arena-200 mx-auto mb-3" />
            <p className="text-sm">No hay clientes registrados aún</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-arena-100 bg-arena-50">
                {["Nombre", "Email", "Rol", "Órdenes", "Total gastado", "Registrado"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-50">
              {users.map((u) => {
                const spent = u.orders.reduce((sum, o) => sum + Number(o.total), 0);
                return (
                  <tr key={u.id} className="hover:bg-arena-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-warm-800">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.role === "ADMIN"
                            ? "bg-arena-100 text-arena-700"
                            : "bg-warm-100 text-warm-600"
                        }`}
                      >
                        {u.role === "ADMIN" ? "Admin" : "Cliente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600">{u._count.orders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-warm-800">
                      {spent > 0 ? formatPrice(spent) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-500">
                      {new Date(u.createdAt!).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-arena-100 flex items-center justify-between">
            <p className="text-sm text-warm-500">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/admin/clientes?pagina=${p}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                    p === page
                      ? "bg-arena-600 text-white"
                      : "text-warm-600 hover:bg-arena-50 border border-arena-200"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
