"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "./CartProvider";
import { toNum } from "@/lib/product-display";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

// Purchasable-product CTA: qty stepper + Add to Cart, with a stock note.
// Rendered instead of QuoteRequestButton when product.is_purchasable is true.
export default function AddToCartPanel({ product }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const price = toNum(product.price) ?? 0;
  const stockQty = toNum(product.stockQuantity ?? product.stock_quantity) ?? 0;
  const imageUrl = product.images?.[0] ?? product.image_url ?? undefined;
  const outOfStock = stockQty <= 0;
  const lowStock = !outOfStock && stockQty <= 5;

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

  const stepBtn =
    "flex h-12 w-12 items-center justify-center transition-colors hover:bg-[var(--well)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]";

  return (
    <div className="w-full">
      <div className="flex gap-3">
        {!outOfStock && (
          <div
            className="flex shrink-0 items-center overflow-hidden rounded-full border"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
          >
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className={stepBtn} aria-label="Decrease quantity">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite" aria-label={`Quantity ${qty}`}>
              {qty}
            </span>
            <button type="button" onClick={() => setQty((q) => Math.min(stockQty, q + 1))} disabled={qty >= stockQty} className={stepBtn} aria-label="Increase quantity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-[opacity,background-color] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          style={added ? { background: "#059669", color: "#fff" } : { background: "var(--ink)", color: "var(--ink-foreground)" }}
        >
          {outOfStock ? (
            "Out of stock"
          ) : added ? (
            <>
              <Check className="h-4 w-4" /> Added to cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </>
          )}
        </button>
      </div>

      {!outOfStock && (
        <p className="mt-2.5 text-xs font-medium" style={{ color: lowStock ? "var(--accent-dark)" : "var(--text-secondary)" }}>
          {lowStock ? `Only ${stockQty} left in stock` : `${stockQty} in stock`}
        </p>
      )}
    </div>
  );
}
