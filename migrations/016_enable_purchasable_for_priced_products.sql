-- ─────────────────────────────────────────────────────────────────
-- 016_enable_purchasable_for_priced_products.sql
--
-- Every active product in the catalog already has a real price and real
-- stock (confirmed: 35/35), but is_purchasable was never turned on for
-- any of them — meaning every product showed "Request a Quote" only,
-- with no way for a customer to actually add anything to a cart.
--
-- Turns on Add-to-Cart for exactly the products that are actually ready
-- to sell that way (a real price, in stock) — a product with no price or
-- no stock is left as quote-only, since fixed-price checkout doesn't make
-- sense for those anyway. Idempotent — only flips rows that qualify and
-- aren't already on, safe to re-run.
--
-- Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

UPDATE products
SET is_purchasable = true
WHERE is_active = true
  AND is_purchasable = false
  AND price IS NOT NULL AND price > 0
  AND stock_quantity > 0;
