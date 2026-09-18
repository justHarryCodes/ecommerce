-- ─────────────────────────────────────────────────────────────────
-- 009_customer_portal.sql
--
-- Customer (non-admin) account section: address book, plus timestamps
-- for the customer-side "confirm payment" / "confirm delivery" actions.
-- Builds on 004_customer_accounts.sql (customers table, orders.customer_id).
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Home',
  recipient_name  TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT NOT NULL,
  city            TEXT,
  state           TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
-- At most one default address per customer
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_addresses_default
  ON customer_addresses(customer_id) WHERE is_default;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by_customer_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ;

-- Seed the address book from any address already saved on the profile
INSERT INTO customer_addresses (customer_id, label, recipient_name, phone, address, city, state, is_default)
SELECT c.id, 'Home', COALESCE(NULLIF(c.name, ''), 'Me'), COALESCE(NULLIF(c.phone, ''), '-'),
       c.address, c.city, c.state, TRUE
FROM customers c
WHERE c.address IS NOT NULL AND c.address <> ''
  AND NOT EXISTS (SELECT 1 FROM customer_addresses a WHERE a.customer_id = c.id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE OR REPLACE TRIGGER customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
