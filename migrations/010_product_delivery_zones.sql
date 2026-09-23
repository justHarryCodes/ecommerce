-- ─────────────────────────────────────────────────────────────────
-- 010_product_delivery_zones.sql
--
-- Splits the flat per-product delivery fee (008_product_delivery_fee.sql)
-- into two zone-based fees — within the company's home state, and
-- interstate/outside the state — plus a delivery timeline note the admin
-- can set per product (e.g. "3-5 business days", "2 weeks — made to order").
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS delivery_fee_within_state NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_interstate   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_timeline         TEXT;

-- Carry the old flat fee forward as the within-state fee so existing
-- products keep their current price until an admin sets the two zones.
UPDATE products
SET delivery_fee_within_state = delivery_fee
WHERE delivery_fee_within_state = 0 AND delivery_fee <> 0;

ALTER TABLE products DROP COLUMN IF EXISTS delivery_fee;
