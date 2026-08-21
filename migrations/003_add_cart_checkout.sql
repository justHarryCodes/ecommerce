-- ─────────────────────────────────────────────────────────────────
-- 003_add_cart_checkout.sql
--
-- Reintroduces a real cart + payment checkout path alongside the
-- existing quote-request flow, per-product: some catalog items are
-- fixed-price and buyable ("Add to Cart"), others stay quote-only
-- ("Request a Quote"). Payment/order infrastructure (orders,
-- order_items, stores.payment_preference/bank_*/paystack_public_key)
-- already existed in schema.sql and was never dropped — this just
-- adds the one new field needed to distinguish product mode.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS). Registered in
-- scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN NOT NULL DEFAULT false;

-- A purchasable product needs a real numeric price + stock to sell
-- against. The seed batch (002) only ever set price_note ("From ₦X"),
-- never a hard price — flip two standard-sized catalog items to
-- fixed-price/buyable so the cart flow has something to demo against.
UPDATE products SET price = 65000, stock_quantity = 15, is_purchasable = true
WHERE slug = 'decorative-concrete-planter';

UPDATE products SET price = 220000, stock_quantity = 8, is_purchasable = true
WHERE slug = 'floating-tv-unit';
