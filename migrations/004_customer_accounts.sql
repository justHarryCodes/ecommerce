-- ─────────────────────────────────────────────────────────────────
-- 004_customer_accounts.sql
--
-- Buyer accounts: customers can log in (Firebase auth, same project
-- as staff — role is decided by ADMIN_EMAILS, not by this table),
-- save a delivery address/profile, and view their order history.
-- Guest checkout still works — orders.customer_id is nullable.
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  firebase_uid  TEXT NOT NULL,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, firebase_uid)
);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_firebase_uid ON customers(firebase_uid);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE OR REPLACE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
