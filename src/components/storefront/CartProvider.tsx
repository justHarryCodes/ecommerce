"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStoreState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
}

type StoreApi = ReturnType<typeof createCartStore>;

// Single-company mode — one cart, no per-store keying needed.
function createCartStore() {
  return create<CartStoreState>()(
    persist(
      (set) => ({
        items: [],

        addItem: (newItem) => {
          // PostgreSQL returns NUMERIC as strings — coerce to numbers at the point of entry
          const item = {
            ...newItem,
            price: Number(newItem.price),
            stock_quantity: Number(newItem.stock_quantity),
          };
          set((state) => {
            const existing = state.items.find((i) => i.product_id === item.product_id);
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.product_id === item.product_id
                    ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), item.stock_quantity) }
                    : i
                ),
              };
            }
            return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] };
          });
        },

        removeItem: (productId) => {
          set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) }));
        },

        updateQuantity: (productId, qty) => {
          if (qty <= 0) {
            set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) }));
          } else {
            set((state) => ({
              items: state.items.map((i) =>
                i.product_id === productId
                  ? { ...i, quantity: Math.min(qty, i.stock_quantity) }
                  : i
              ),
            }));
          }
        },

        clearCart: () => set({ items: [] }),
      }),
      { name: "cart" }
    )
  );
}

const CartContext = createContext<StoreApi | null>(null);

export function useCart() {
  const storeApi = useContext(CartContext);
  if (!storeApi) throw new Error("useCart must be used within CartProvider");
  const state = useStore(storeApi);
  const totalItems = state.items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const totalAmount = state.items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
  return { ...state, totalItems, totalAmount };
}

export default function CartProvider({ children }: { children: ReactNode }) {
  // Create the store exactly once, never recreated on re-render
  const storeRef = useRef<StoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createCartStore();
  }

  return <CartContext.Provider value={storeRef.current}>{children}</CartContext.Provider>;
}
