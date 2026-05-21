"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
};

type FreshData = { price: number; stock: number; active: boolean };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (productId: string) => void;
  update: (productId: string, quantity: number) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tienda_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let parsed: CartItem[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) parsed = JSON.parse(stored);
    } catch {}

    if (parsed.length > 0) {
      setItems(parsed);
      // Refresh prices and stock from the DB in the background
      const ids = parsed.map((i) => i.productId).join(",");
      fetch(`/api/cart/prices?ids=${ids}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((fresh: Record<string, FreshData>) => {
          setItems((prev) =>
            prev
              .filter((item) => fresh[item.productId]?.active !== false)
              .map((item) => {
                const data = fresh[item.productId];
                if (!data) return item;
                return {
                  ...item,
                  price: data.price,
                  stock: data.stock,
                  quantity: Math.min(item.quantity, data.stock),
                };
              })
          );
        })
        .catch(() => {});
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((incoming: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const qty = incoming.quantity ?? 1;
      const existing = prev.find((i) => i.productId === incoming.productId);
      if (existing) {
        // Always update price and stock from the incoming data (fresh from DB)
        return prev.map((i) =>
          i.productId === incoming.productId
            ? {
                ...i,
                price: incoming.price,
                stock: incoming.stock,
                quantity: Math.min(i.quantity + qty, incoming.stock),
              }
            : i
        );
      }
      return [...prev, { ...incoming, quantity: qty }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const update = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        add,
        remove,
        update,
        clear,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
