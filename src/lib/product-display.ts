import type { Product } from "@/types";

// Postgres NUMERIC columns arrive as strings (no pg type parser is set), so
// always coerce before comparing — "9000" > "10000" is true as strings.
export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface ProductDisplay {
  image: string | null;
  price: number | null;
  comparePrice: number | null;
  /** Whole-number % saved vs compare price, or null when there's no saving. */
  discountPct: number | null;
  priceNote: string | null;
  purchasable: boolean;
  stockQty: number;
  outOfStock: boolean;
  freeDelivery: boolean;
  shortDescription: string | null;
}

export function productDisplay(p: Product): ProductDisplay {
  const price = toNum(p.price);
  const comparePrice = toNum(p.comparePrice ?? p.compare_price);
  const discountPct =
    price !== null && comparePrice !== null && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;
  const purchasable = p.isPurchasable ?? p.is_purchasable ?? false;
  const stockQty = toNum(p.stockQuantity ?? p.stock_quantity) ?? 0;

  return {
    image: p.images?.[0] ?? p.image_url ?? null,
    price,
    comparePrice: discountPct !== null ? comparePrice : null,
    discountPct: discountPct && discountPct > 0 ? discountPct : null,
    priceNote: p.price_note ?? p.priceNote ?? null,
    purchasable,
    stockQty,
    outOfStock: purchasable && stockQty <= 0,
    freeDelivery: p.freeDelivery ?? p.free_delivery ?? false,
    shortDescription: p.short_description ?? p.shortDescription ?? null,
  };
}
