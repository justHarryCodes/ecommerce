-- ─────────────────────────────────────────────────────────────────
-- 017_default_delivery_timeline.sql
--
-- 4 of 35 active products had no delivery_timeline at all (admin never
-- typed one in) — backfills those with the standard "7-12 business days"
-- window. Products that already have a value (even an inconsistently
-- formatted one, e.g. "5 days" or "8") are left untouched — those were
-- deliberately entered and may reflect a genuinely different timeline for
-- that specific item.
--
-- Idempotent — only touches rows that are still blank.
-- Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

UPDATE products
SET delivery_timeline = '7-12 business days'
WHERE is_active = true
  AND (delivery_timeline IS NULL OR delivery_timeline = '');
