// Single place the markup percentages live — change them here, not by
// hunting through the product form/API for every place price gets computed.
export const SALE_MARKUP = 0.20;    // sale price = base + 20%
export const COMPARE_MARKUP = 0.30; // "was" price = base + 30%, shown struck through

export interface DerivedPricing {
  price: number;
  comparePrice: number;
}

// Admin enters one number (her cost/base price); the sale price and the
// struck-through "compare" price are both derived from it. Rounded to the
// nearest whole naira to match how prices are shown everywhere else on the
// site (no kobo). Authoritative version of this lives server-side
// (createProduct/products API) — this is also used client-side purely to
// show a live preview as the admin types.
export function computePricing(basePrice: number): DerivedPricing {
  return {
    price: Math.round(basePrice * (1 + SALE_MARKUP)),
    comparePrice: Math.round(basePrice * (1 + COMPARE_MARKUP)),
  };
}
