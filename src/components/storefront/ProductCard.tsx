"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ShoppingCart, Check } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatCurrency } from "@/lib/utils";
import { clCard } from "@/lib/cloudinary";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

// Catalog card — two modes:
//  - Purchasable (fixed price): shows a price tag + quick "Add to Cart" button.
//  - Quote-only (default): shows the price note (or "Request a quote") and a
//    plain "View details" link — the quote flow lives on the detail page.
export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const images = product.images ?? [];
  const imageUrl = images[0] ?? product.image_url ?? null;
  const priceNote = product.price_note ?? product.priceNote;
  const price = product.price;
  const purchasable = product.isPurchasable ?? product.is_purchasable ?? false;
  const stockQty = product.stockQuantity ?? product.stock_quantity ?? 0;
  const outOfStock = purchasable && stockQty <= 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || price == null) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price,
      image_url: imageUrl ?? undefined,
      stock_quantity: stockQty,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link
      href={`/products/${product.slug ?? product.id}`}
      prefetch={false}
      className="group flex flex-col rounded-2xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_10px_32px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-50 dark:bg-surface-800">
        {imageUrl ? (
          <img
            src={clCard(imageUrl)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-surface-200 dark:text-surface-700">
            🛠️
          </div>
        )}

        {/* Mode badge */}
        <span
          className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide text-white shadow-sm"
          style={{ background: purchasable ? "var(--accent)" : "rgba(0,0,0,0.6)" }}
        >
          {purchasable ? "In stock" : "Made to order"}
        </span>

        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white/90 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5 pt-3 gap-1.5">
        <p className="text-[13px] font-semibold text-surface-800 dark:text-surface-100 line-clamp-2 leading-snug flex-1">
          {product.name}
        </p>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-black text-[15px]" style={{ color: "var(--accent)" }}>
            {price != null ? formatCurrency(price) : priceNote ?? "Request a quote"}
          </span>
        </div>

        {purchasable ? (
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] text-white ${
              added ? "bg-emerald-500" : ""
            }`}
            style={added ? {} : { background: "var(--accent)" }}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
              </>
            )}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
            View details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Link>
  );
}
