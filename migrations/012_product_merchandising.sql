-- ─────────────────────────────────────────────────────────────────
-- 012_product_merchandising.sql
--
-- Homepage merchandising placements — same admin-curated flag pattern
-- as the existing products.is_featured column: a checkbox on the
-- product form adds/removes a product from a homepage section.
--
--   is_featured     -> "Featured Products" (already existed)
--   is_top_selling  -> "Top Selling"
--   is_sponsored    -> "Sponsored Products"
--
-- Partial indexes keep the homepage queries (WHERE store_id = $1 AND
-- is_active = true AND is_<flag> = true) fast as the catalog grows.
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_top_selling BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_sponsored   BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products (store_id, sort_order) WHERE is_active = true AND is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_top_selling
  ON products (store_id, sort_order) WHERE is_active = true AND is_top_selling = true;
CREATE INDEX IF NOT EXISTS idx_products_sponsored
  ON products (store_id, sort_order) WHERE is_active = true AND is_sponsored = true;
