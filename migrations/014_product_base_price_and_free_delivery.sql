-- ─────────────────────────────────────────────────────────────────
-- 014_product_base_price_and_free_delivery.sql
--
-- Pricing: admin now enters a single "base price" (her cost) per product.
-- The sale price (products.price) and compare/"was" price
-- (products.compare_price) are derived from it server-side — +20% and
-- +30% respectively (see src/lib/pricing.ts) — and stored as before, so
-- no downstream display code (product cards, checkout, etc.) needs to
-- change. base_price is kept so editing a product later doesn't require
-- reverse-calculating the original cost from the marked-up price.
--
-- Delivery: free_delivery is an explicit flag rather than inferring
-- "free" from a $0 fee, so the storefront can confidently show a
-- "Free Delivery" badge only when the admin actually chose that (a
-- product simply left at its $0 default is not the same thing).
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS base_price     NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS free_delivery  BOOLEAN NOT NULL DEFAULT FALSE;
