-- ─────────────────────────────────────────────────────────────────
-- 005_product_search.sql
--
-- Product search, properly indexed. pg_trgm gives fast, typo-tolerant
-- substring matching (ILIKE '%term%' and similarity() ranking) — the
-- right index type for a live "search as you type" box, unlike a
-- plain B-tree which only accelerates prefix (LIKE 'term%') lookups.
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_short_description_trgm
  ON products USING gin (short_description gin_trgm_ops);
