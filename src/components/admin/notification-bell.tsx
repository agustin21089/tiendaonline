"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, ShoppingBag, Package, X, ExternalLink } from "lucide-react";
import Link from "next/link";

const POLL_INTERVAL = 30_000; // 30 seconds
const LS_KEY = "admin_bell_last_seen";

type RecentOrder = {
  id: string;
  number: number;
  name: string;
  total: number;
  status: string;
  createdAt: string;
};

type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
};

type NotificationsData = {
  pendingOrders: number;
  lowStock: number;
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function NotificationBell() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load lastSeen from localStorage
  useEffect(() => {
    setLastSeen(localStorage.getItem(LS_KEY));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      // Mark as seen now
      const now = new Date().toISOString();
      localStorage.setItem(LS_KEY, now);
      setLastSeen(now);
    }
  }

  // Count "new" orders since last seen
  const newSince = lastSeen ? new Date(lastSeen) : null;
  const newOrdersCount = data
    ? data.recentOrders.filter((o) => newSince === null || new Date(o.createdAt) > newSince).length
    : 0;

  const badge = data ? data.pendingOrders + data.lowStock : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-warm-500 hover:bg-arena-50 hover:text-warm-700 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-[18px] h-[18px]" />
        {badge > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-arena-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-arena-100">
            <span className="text-sm font-semibold text-warm-800">Notificaciones</span>
            <button onClick={() => setOpen(false)} className="text-warm-400 hover:text-warm-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!data ? (
            <div className="px-4 py-6 text-center text-sm text-warm-400">Cargando…</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {/* Pending orders alert */}
              {data.pendingOrders > 0 && (
                <Link
                  href="/admin/ordenes?status=PENDING"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-arena-50 transition-colors border-b border-arena-50"
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 shrink-0">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800">
                      {data.pendingOrders} orden{data.pendingOrders !== 1 ? "es" : ""} pendiente{data.pendingOrders !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-warm-500">Requieren atención</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                </Link>
              )}

              {/* Low stock alert */}
              {data.lowStock > 0 && (
                <Link
                  href="/admin/productos?stockBajo=1"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-arena-50 transition-colors border-b border-arena-50"
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 shrink-0">
                    <Package className="w-4 h-4 text-red-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800">
                      {data.lowStock} producto{data.lowStock !== 1 ? "s" : ""} con stock bajo
                    </p>
                    <div className="mt-0.5 space-y-0.5">
                      {data.lowStockProducts.slice(0, 3).map((p) => (
                        <p key={p.id} className="text-xs text-warm-500 truncate">
                          {p.name} — <span className="font-medium text-red-600">{p.stock} unidades</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-warm-400 shrink-0 mt-0.5" />
                </Link>
              )}

              {/* Recent orders */}
              {data.recentOrders.length > 0 && (
                <div className="border-b border-arena-50">
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-warm-400 uppercase tracking-wide">Órdenes recientes</p>
                  {data.recentOrders.map((order) => {
                    const isNew = newSince === null || new Date(order.createdAt) > newSince;
                    return (
                      <Link
                        key={order.id}
                        href={`/admin/ordenes/${order.id}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-arena-50 transition-colors ${isNew ? "bg-arena-50/60" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-warm-800">#{order.number}</span>
                            {isNew && (
                              <span className="text-[10px] font-bold bg-arena-400 text-white px-1.5 py-0.5 rounded-full leading-none">NUEVO</span>
                            )}
                            <span className="text-xs text-warm-400">{STATUS_LABEL[order.status] ?? order.status}</span>
                          </div>
                          <p className="text-xs text-warm-500 truncate mt-0.5">{order.name} · {formatPrice(order.total)}</p>
                        </div>
                        <span className="text-xs text-warm-400 shrink-0">{timeAgo(order.createdAt)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* All clear */}
              {data.pendingOrders === 0 && data.lowStock === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-warm-500">Todo en orden ✓</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-arena-100 flex justify-between">
            <Link
              href="/admin/ordenes"
              onClick={() => setOpen(false)}
              className="text-xs text-arena-600 hover:text-arena-800 font-medium transition-colors"
            >
              Ver todas las órdenes →
            </Link>
            <Link
              href="/admin/reportes"
              onClick={() => setOpen(false)}
              className="text-xs text-warm-400 hover:text-warm-600 transition-colors"
            >
              Reportes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
