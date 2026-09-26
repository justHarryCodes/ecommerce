-- ─────────────────────────────────────────────────────────────────
-- 013_service_images.sql
--
-- Services can now carry up to 3 sample images (same cap/pattern as
-- products), instead of just one. Existing single image_url values are
-- copied into the new array so nothing already set is lost.
--
-- Idempotent. Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

UPDATE services
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url <> '' AND images = '{}';
