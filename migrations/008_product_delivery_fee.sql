-- ─────────────────────────────────────────────────────────────────
-- 008_product_delivery_fee.sql
--
-- Adds a per-product delivery fee, settable by the admin when adding
-- or editing a product (some items — e.g. large furniture — cost
-- more to deliver than others). Defaults to 0 so existing rows and
-- any code that doesn't yet read this column are unaffected.
--
-- Idempotent (IF NOT EXISTS). Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0;
