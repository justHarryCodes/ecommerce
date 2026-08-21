"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

// Purchasable-product CTA: qty stepper + Add to Cart, with a stock indicator.
// Rendered instead of QuoteRequestButton when product.is_purchasable is true.
export default function AddToCartPanel({ product }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const price = product.price ?? 0;
  const stockQty = product.stockQuantity ?? product.stock_quantity ?? 0;
  const images = product.images ?? [];
  const imageUrl = images[0] ?? product.image_url ?? undefined;
  const outOfStock = stockQty <= 0;

  function handleAdd() {
    if (outOfStock) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price,
      image_url: imageUrl,
      stock_quantity: stockQty,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {!outOfStock && (
        <div
          className="flex items-center rounded-xl border overflow-hidden shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-11 h-12 flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-primary)" }}
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(stockQty, q + 1))}
            className="w-11 h-12 flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-primary)" }}
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          added ? "bg-emerald-500" : ""
        }`}
        style={added ? {} : { background: "var(--accent)" }}
      >
        {outOfStock ? (
          "Out of stock"
        ) : added ? (
          <>
            <Check className="w-4 h-4" /> Added to cart
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" /> Add to cart
          </>
        )}
      </button>

      {!outOfStock && (
        <span className="text-xs sm:ml-1" style={{ color: "var(--text-muted)" }}>
          {stockQty} in stock
        </span>
      )}
    </div>
  );
}
