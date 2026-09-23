-- ─────────────────────────────────────────────────────────────────
-- 011_company_contact_info.sql
--
-- Sets the real company contact details (WhatsApp, support email,
-- location) in place of the placeholder seed values from
-- 002_company_pivot.sql. Guarded by the old placeholder values so this
-- never overwrites a real edit already made via /dashboard/settings.
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

UPDATE stores
SET
  whatsapp = '+2349068044171',
  email    = 'support@buildandfunish.com',
  address  = 'Benin City, Edo State, Nigeria'
WHERE slug = 'forge-and-form'
  AND whatsapp = '+234 800 000 0000'
  AND email    = 'hello@forgeandform.example'
  AND address  = '12 Industrial Avenue, Lagos, Nigeria';
