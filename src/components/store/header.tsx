"use client";

import { useCart } from "@/context/cart-context";
import { CartDrawer } from "./cart-drawer";
import { UserMenu } from "./user-menu";
import Link from "next/link";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useState } from "react";

type Category = { name: string; slug: string };

interface Props {
  storeName: string;
  categories: Category[];
}

export function StoreHeader({ storeName, categories }: Props) {
  const { count, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-arena-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="font-display text-xl font-semibold text-arena-700 shrink-0"
            >
              {storeName}
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="px-3 py-2 text-sm text-warm-600 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link
                href="/buscar"
                className="p-2.5 text-warm-500 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </Link>

              <button
                onClick={openCart}
                className="relative p-2.5 text-warm-500 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-arena-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              <UserMenu />

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2.5 text-warm-500 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-arena-100 bg-white px-4 py-3 space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-warm-700 hover:bg-arena-50 rounded-lg transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
