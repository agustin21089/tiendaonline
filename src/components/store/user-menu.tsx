"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, ShoppingBag, Settings } from "lucide-react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-arena-100 animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/login"
          className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
        >
          Ingresar
        </Link>
        <Link
          href="/registro"
          className="px-3 py-1.5 text-xs font-medium bg-arena-500 text-white rounded-lg hover:bg-arena-600 transition-colors"
        >
          Registrarme
        </Link>
      </div>
    );
  }

  const user = session.user as { name?: string; email?: string; image?: string; role?: string };
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-arena-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-arena-200 overflow-hidden flex items-center justify-center">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-arena-600" />
          )}
        </div>
        <span className="hidden sm:block text-xs font-medium text-warm-700 max-w-20 truncate">
          {user.name?.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-arena-200 shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-arena-100">
            <p className="text-xs font-semibold text-warm-800 truncate">{user.name}</p>
            <p className="text-xs text-warm-400 truncate">{user.email}</p>
          </div>

          <Link
            href="/cuenta/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-700 hover:bg-arena-50 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-arena-400" /> Mi perfil
          </Link>
          <Link
            href="/cuenta/pedidos"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-700 hover:bg-arena-50 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-arena-400" /> Mis pedidos
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-arena-700 hover:bg-arena-50 transition-colors border-t border-arena-100"
            >
              <Settings className="w-3.5 h-3.5 text-arena-500" /> Panel admin
            </Link>
          )}

          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warm-500 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-arena-100"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
