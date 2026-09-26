-- ─────────────────────────────────────────────────────────────────
-- 015_affiliates.sql
--
-- Product affiliate program: an affiliate signs up (or is added by the
-- admin), gets a unique code, and shares it as ?ref=CODE on any product
-- (or any page) link. A cookie captures the code on landing (see
-- middleware.ts) and rides along to checkout, where the order is
-- attributed and a commission snapshot is stored.
--
-- Drops the old `affiliates` / `affiliate_referrals` / `affiliate_payouts`
-- tables first — those were leftover from the pre-pivot multi-vendor
-- marketplace (vendors referring other vendors to sign up for the SaaS),
-- a completely different concept from this one, and confirmed empty
-- (0 rows, no live code references them). Reusing the clean `affiliates`
-- name for the real feature beats picking an awkward alternate name just
-- to dodge legacy cruft.
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

-- stores.referred_by_affiliate_id (another leftover from the same dead
-- vendor-referral system) holds an FK into `affiliates` and blocks
-- dropping it otherwise. Confirmed unused by any live code (grepped) —
-- dropping the column removes the constraint along with it.
ALTER TABLE stores DROP COLUMN IF EXISTS referred_by_affiliate_id;

DROP TABLE IF EXISTS affiliate_referrals;
DROP TABLE IF EXISTS affiliate_payouts;
DROP TABLE IF EXISTS affiliates;

CREATE TABLE affiliates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  -- Set when the affiliate signs themselves up (or later links an
  -- account); NULL for a partner the admin added by hand who hasn't
  -- created a login yet.
  firebase_uid      TEXT UNIQUE,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  code              TEXT NOT NULL,
  commission_rate   NUMERIC(5, 2) NOT NULL DEFAULT 10, -- percent, of order subtotal (not delivery)
  total_paid        NUMERIC(12, 2) NOT NULL DEFAULT 0, -- running total the admin has marked as paid out
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, code)
);
CREATE INDEX idx_affiliates_store_id ON affiliates(store_id);
CREATE INDEX idx_affiliates_firebase_uid ON affiliates(firebase_uid);

-- Orders carry a snapshot of the attribution + commission at the time the
-- order was placed, so a later change to an affiliate's rate (or deleting
-- the affiliate entirely — hence ON DELETE SET NULL + the denormalized
-- affiliate_code) never rewrites historical numbers.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS affiliate_id       UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_code     TEXT,
  ADD COLUMN IF NOT EXISTS commission_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE OR REPLACE TRIGGER affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
