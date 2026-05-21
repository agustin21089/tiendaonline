"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
  Truck,
  Ticket,
  Image,
  Settings,
  Store,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tag },
  { href: "/admin/ordenes", label: "Órdenes", icon: ShoppingCart },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/envios", label: "Envíos", icon: Truck },
  { href: "/admin/cupones", label: "Cupones", icon: Ticket },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-warm-900 text-warm-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-warm-700">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Store className="w-6 h-6 text-arena-400" />
          <span className="font-display text-lg font-semibold text-arena-300">
            Admin Panel
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-arena-600 text-white"
                  : "text-warm-300 hover:bg-warm-700 hover:text-warm-100",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-warm-700">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-xs text-warm-400 hover:text-warm-200 transition-colors"
        >
          <Store className="w-3.5 h-3.5" />
          Ver tienda →
        </Link>
      </div>
    </aside>
  );
}
