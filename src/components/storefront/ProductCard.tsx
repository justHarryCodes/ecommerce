"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ShoppingCart, Check, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatCurrency } from "@/lib/utils";
import { clCard } from "@/lib/cloudinary";
import { productDisplay } from "@/lib/product-display";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

// Catalog card. The product name is a "stretched" link covering the whole
// card, and the cart button sits above it — so there's no <button> nested
// inside an <a> (invalid HTML, and it confuses screen readers).
//  - Purchasable: price + round "add to cart" icon button.
//  - Quote-only: price note / "Price on request" + arrow to the detail page.
export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const d = productDisplay(product);
  const href = `/products/${product.slug ?? product.id}`;

  function handleAddToCart() {
    if (d.outOfStock || d.price === null) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price: d.price,
      image_url: d.image ?? undefined,
      stock_quantity: d.stockQty,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      className="group relative flex flex-col rounded-2xl border p-2.5 transition-[box-shadow,transform] duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(23,18,14,0.28)] focus-within:shadow-[0_18px_40px_-18px_rgba(23,18,14,0.28)]"
      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
    >
      {/* Image well */}
      <div className="relative aspect-square overflow-hidden rounded-xl" style={{ background: "var(--well)" }}>
        {d.image ? (
          <img
            src={clCard(d.image)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">🛠️</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {d.discountPct !== null && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: "var(--accent-dark)" }}>
              -{d.discountPct}%
            </span>
          )}
          {!d.purchasable && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--ink)" }}>
              Made to order
            </span>
          )}
        </div>

        {d.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black">Out of stock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <h3 className="text-[13.5px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>
          <Link
            href={href}
            prefetch={false}
            className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--accent)]"
          >
            {product.name}
          </Link>
        </h3>
        {d.freeDelivery && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--accent-dark)" }}>
            <Truck className="h-3 w-3" aria-hidden="true" /> Free delivery
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {d.comparePrice !== null && (
              <p className="text-[11px] line-through" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(d.comparePrice)}
              </p>
            )}
            <p className="truncate text-[15px] font-extrabold" style={{ color: "var(--text-primary)" }}>
              {d.price !== null ? formatCurrency(d.price) : d.priceNote ?? "Price on request"}
            </p>
          </div>

          {d.purchasable && d.price !== null ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={d.outOfStock}
              aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-[var(--well)] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
              style={
                added
                  ? { background: "#059669", borderColor: "#059669", color: "#fff" }
                  : { borderColor: "var(--border)", color: "var(--text-primary)" }
              }
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors group-hover:bg-[var(--ink)] group-hover:text-white"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
