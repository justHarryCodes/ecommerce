-- ─────────────────────────────────────────────────────────────────
-- 006_rebrand_binted.sql
--
-- Renames the placeholder "Forge & Form" seed company to BINTED
-- (Believe Interior Design) and points its logo at the new mark.
-- Guarded by `name = 'Forge & Form'` so this never overwrites a real
-- edit already made via /dashboard/settings — on a database where
-- the name has already been changed (by hand or by an earlier run of
-- this migration), it's a no-op.
--
-- Idempotent. Registered in scripts/run-migrations.mjs. The internal
-- `slug` ('forge-and-form') is left untouched — it's just an internal
-- lookup key (COMPANY_STORE_SLUG in src/lib/auth.ts), never shown to
-- visitors, so renaming it would add risk with no visible benefit.
-- ─────────────────────────────────────────────────────────────────

UPDATE stores
SET
  name = 'BINTED',
  description = 'BINTED — Believe Interior Design. Integrated fabrication and interior solutions: metalwork, aluminium & glass, woodworking, decorative concrete, and complete interior fit-outs, from consultation to installation.',
  logo_url = '/logo.svg'
WHERE slug = 'forge-and-form' AND name = 'Forge & Form';
