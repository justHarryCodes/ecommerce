-- ─────────────────────────────────────────────────────────────────
-- 002_company_pivot.sql
--
-- Pivots the schema from a multi-vendor marketplace ("Duka") to a
-- single-company site for an integrated fabrication & interiors
-- business. Adds catalog fields to `products`, company-profile
-- fields to `stores`, and every new content table the site needs
-- (services, projects, gallery, blog, careers, testimonials, quote
-- requests, newsletter).
--
-- SAFE TO RUN MULTIPLE TIMES (idempotent): all DDL uses IF NOT
-- EXISTS / ADD COLUMN IF NOT EXISTS, and the seed block at the
-- bottom no-ops if a store with slug 'forge-and-form' already
-- exists.
--
-- ⚠️  Run this against a DEV database only. Do NOT point
--     DATABASE_URL at a production/live database — this migration
--     was written for a project that pivoted away from a live
--     multi-vendor marketplace, and other rows may already exist
--     in `stores`/`products`/etc. that this migration does not
--     touch, but the application code that follows assumes the
--     *only* store it cares about is the one seeded here
--     (slug = 'forge-and-form', overridable via the
--     COMPANY_STORE_SLUG env var).
--
-- Registered in scripts/run-migrations.mjs.
-- ─────────────────────────────────────────────────────────────────

-- ─── Products: catalog fields ──────────────────────────────────────
-- Price becomes optional — a fabrication catalog often shows "From
-- ₦X" or "Contact for quote" instead of a fixed price.
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_options TEXT[] NOT NULL DEFAULT '{}';

-- ─── Stores: company-profile fields ────────────────────────────────
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS map_embed_url TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mission TEXT;

-- ─── Services ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  short_description   TEXT,
  description         TEXT,
  icon                TEXT,
  image_url           TEXT,
  benefits            TEXT[] NOT NULL DEFAULT '{}',
  related_product_ids UUID[] NOT NULL DEFAULT '{}',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_services_store_id ON services(store_id);

-- ─── Projects (portfolio) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'residential'
                      CHECK (category IN ('residential','commercial','hotels','schools','offices','restaurants')),
  location          TEXT,
  description       TEXT,
  services_provided TEXT[] NOT NULL DEFAULT '{}',
  before_images     TEXT[] NOT NULL DEFAULT '{}',
  after_images      TEXT[] NOT NULL DEFAULT '{}',
  images            TEXT[] NOT NULL DEFAULT '{}',
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_projects_store_id ON projects(store_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

-- ─── Gallery ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title           TEXT,
  media_type      TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  media_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  filter_category TEXT NOT NULL DEFAULT 'metal'
                    CHECK (filter_category IN ('metal','aluminum_glass','wood','decorative_concrete','interior','exterior')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gallery_store_id ON gallery_items(store_id);
CREATE INDEX IF NOT EXISTS idx_gallery_filter ON gallery_items(filter_category);

-- ─── Blog ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  excerpt       TEXT,
  content       TEXT NOT NULL DEFAULT '',
  cover_image   TEXT,
  category      TEXT,
  author        TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_store_id ON blog_posts(store_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);

-- ─── Careers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  department      TEXT,
  location        TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time'
                    CHECK (employment_type IN ('full_time','part_time','contract','internship')),
  description     TEXT,
  requirements    TEXT,
  is_internship   BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_job_postings_store_id ON job_postings(store_id);

CREATE TABLE IF NOT EXISTS job_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id  UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  applicant_name  TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  resume_url      TEXT,
  cover_note      TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','reviewed','shortlisted','rejected','hired')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_applications_posting_id ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_store_id ON job_applications(store_id);

-- ─── Testimonials ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name  TEXT NOT NULL,
  customer_title TEXT,
  quote          TEXT NOT NULL,
  rating         SMALLINT CHECK (rating BETWEEN 1 AND 5),
  photo_url      TEXT,
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_store_id ON testimonials(store_id);

-- ─── Quote requests (leads) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT NOT NULL,
  message     TEXT,
  source_type TEXT NOT NULL DEFAULT 'general'
                CHECK (source_type IN ('product','service','project','contact_form','general')),
  source_id   UUID,
  source_name TEXT,
  status      TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','quoted','won','lost')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quote_requests_store_id ON quote_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);

-- ─── Newsletter ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, email)
);

-- ─── updated_at triggers (reuses update_updated_at() from schema.sql) ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE OR REPLACE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE OR REPLACE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE OR REPLACE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE OR REPLACE TRIGGER job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE OR REPLACE TRIGGER quote_requests_updated_at BEFORE UPDATE ON quote_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- Seed: single company profile row + placeholder catalog/content so
-- every page renders real-looking content out of the box. Swap for
-- real company data via the dashboard once it's live.
-- No-ops entirely if 'forge-and-form' already exists (idempotent).
-- ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_store_id     UUID;
  v_cat_metal    UUID;
  v_cat_alum     UUID;
  v_cat_wood     UUID;
  v_cat_concrete UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM stores WHERE slug = 'forge-and-form') THEN
    RAISE NOTICE 'forge-and-form already seeded — skipping seed block.';
    RETURN;
  END IF;

  INSERT INTO stores (
    owner_id, name, slug, description, phone, whatsapp, email, address,
    primary_category, is_active, vision, mission, business_hours, social_links
  ) VALUES (
    'REPLACE_WITH_FIREBASE_UID',
    'Forge & Form',
    'forge-and-form',
    'Integrated fabrication and interior solutions — metalwork, aluminium & glass, woodworking, decorative concrete, and complete interior fit-outs, from consultation to installation.',
    '+234 800 000 0000',
    '+234 800 000 0000',
    'hello@forgeandform.example',
    '12 Industrial Avenue, Lagos, Nigeria',
    'other',
    true,
    'To be the region''s most trusted name in integrated fabrication and interior design.',
    'We design, fabricate, and install with precision — delivering premium, durable spaces and structures, on time, every time.',
    '{"mon_fri":"8:00 AM - 6:00 PM","sat":"9:00 AM - 4:00 PM","sun":"Closed"}'::jsonb,
    '{"facebook":"https://facebook.com","instagram":"https://instagram.com","linkedin":"https://linkedin.com"}'::jsonb
  ) RETURNING id INTO v_store_id;

  -- ── Categories ──────────────────────────────────────────────────
  INSERT INTO categories (store_id, name, slug, sort_order) VALUES (v_store_id, 'Metal Products', 'metal-products', 1) RETURNING id INTO v_cat_metal;
  INSERT INTO categories (store_id, parent_id, name, slug, sort_order) VALUES
    (v_store_id, v_cat_metal, 'Gates', 'gates', 1),
    (v_store_id, v_cat_metal, 'Security Doors', 'security-doors', 2),
    (v_store_id, v_cat_metal, 'Railings', 'railings', 3),
    (v_store_id, v_cat_metal, 'Beds', 'beds', 4),
    (v_store_id, v_cat_metal, 'Tables', 'tables', 5),
    (v_store_id, v_cat_metal, 'Chairs', 'chairs', 6),
    (v_store_id, v_cat_metal, 'Shelves', 'shelves', 7);

  INSERT INTO categories (store_id, name, slug, sort_order) VALUES (v_store_id, 'Aluminum & Glass', 'aluminum-glass', 2) RETURNING id INTO v_cat_alum;
  INSERT INTO categories (store_id, parent_id, name, slug, sort_order) VALUES
    (v_store_id, v_cat_alum, 'Sliding Windows', 'sliding-windows', 1),
    (v_store_id, v_cat_alum, 'Casement Windows', 'casement-windows', 2),
    (v_store_id, v_cat_alum, 'Shop Fronts', 'shop-fronts', 3),
    (v_store_id, v_cat_alum, 'Office Partitions', 'office-partitions', 4),
    (v_store_id, v_cat_alum, 'Shower Cubicles', 'shower-cubicles', 5),
    (v_store_id, v_cat_alum, 'Glass Doors', 'glass-doors', 6);

  INSERT INTO categories (store_id, name, slug, sort_order) VALUES (v_store_id, 'Wood Products', 'wood-products', 3) RETURNING id INTO v_cat_wood;
  INSERT INTO categories (store_id, parent_id, name, slug, sort_order) VALUES
    (v_store_id, v_cat_wood, 'Kitchen Cabinets', 'kitchen-cabinets', 1),
    (v_store_id, v_cat_wood, 'Wardrobes', 'wardrobes', 2),
    (v_store_id, v_cat_wood, 'TV Units', 'tv-units', 3),
    (v_store_id, v_cat_wood, 'Office Furniture', 'office-furniture', 4),
    (v_store_id, v_cat_wood, 'Bedroom Furniture', 'bedroom-furniture', 5);

  INSERT INTO categories (store_id, name, slug, sort_order) VALUES (v_store_id, 'Decorative Concrete', 'decorative-concrete', 4) RETURNING id INTO v_cat_concrete;
  INSERT INTO categories (store_id, parent_id, name, slug, sort_order) VALUES
    (v_store_id, v_cat_concrete, 'Planters', 'planters', 1),
    (v_store_id, v_cat_concrete, 'Garden Benches', 'garden-benches', 2),
    (v_store_id, v_cat_concrete, 'Decorative Pots', 'decorative-pots', 3),
    (v_store_id, v_cat_concrete, 'Outdoor Tables', 'outdoor-tables', 4),
    (v_store_id, v_cat_concrete, 'Landscape Features', 'landscape-features', 5);

  -- ── Products (placeholder catalog) ──────────────────────────────
  INSERT INTO products (store_id, category_id, name, slug, short_description, description, price_note, image_url, images, is_active, is_featured, sort_order, material_options, color_options, size_options) VALUES
    (v_store_id, v_cat_metal, 'Modern Security Gate', 'modern-security-gate', 'Heavy-duty sliding gate with a powder-coated finish.', 'A robust, modern sliding security gate built from mild steel with a durable powder-coated finish. Engineered for daily use with smooth-glide rollers and reinforced hinges.', 'From ₦450,000', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80'], true, true, 1, ARRAY['Mild Steel','Wrought Iron'], ARRAY['Black','Charcoal Grey','Bronze'], ARRAY['3m Wide','4m Wide','Custom']),
    (v_store_id, v_cat_metal, 'Executive Security Door', 'executive-security-door', 'Reinforced steel door with multi-point locking.', 'A premium security door built for durability, featuring multi-point locking, a scratch-resistant finish, and an optional decorative grille.', 'From ₦280,000', 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=1200&q=80'], true, true, 2, ARRAY['Mild Steel','Stainless Steel'], ARRAY['Black','Silver','White'], ARRAY['Standard 90cm','Standard 100cm','Custom']),
    (v_store_id, v_cat_alum, 'Aluminium Sliding Window', 'aluminium-sliding-window', 'Slim-profile sliding window with tempered glass.', 'Energy-efficient aluminium sliding windows with tempered safety glass, weatherproof seals, and a slim modern profile.', 'From ₦95,000 per m²', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80'], true, true, 3, ARRAY['Aluminium + Clear Glass','Aluminium + Tinted Glass'], ARRAY['Natural Silver','Matte Black','White'], ARRAY['Custom sizing']),
    (v_store_id, v_cat_alum, 'Frameless Glass Office Partition', 'frameless-glass-office-partition', 'Modern frameless partitions for open-plan offices.', 'Frameless glass partitions that bring in natural light while defining space — ideal for modern offices and meeting rooms.', 'From ₦120,000 per m²', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'], true, false, 4, ARRAY['Tempered Glass','Frosted Glass'], ARRAY['Clear','Frosted'], ARRAY['Custom sizing']),
    (v_store_id, v_cat_wood, 'Modern Kitchen Cabinet Set', 'modern-kitchen-cabinet-set', 'Custom-built cabinetry in a range of finishes.', 'Fully custom kitchen cabinetry built to your space — soft-close hinges, durable laminate or veneer finishes, and integrated storage solutions.', 'From ₦850,000', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80'], true, true, 5, ARRAY['MDF + Laminate','Solid Wood','Veneer'], ARRAY['Matte White','Oak','Walnut','Charcoal'], ARRAY['Custom to kitchen layout']),
    (v_store_id, v_cat_wood, 'Built-in Wardrobe', 'built-in-wardrobe', 'Space-saving wardrobe with sliding or hinged doors.', 'Custom-fitted wardrobes with a mix of hanging space, drawers, and shelving — sliding or hinged door options available.', 'From ₦380,000', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1200&q=80'], true, false, 6, ARRAY['MDF + Laminate','Solid Wood'], ARRAY['Matte White','Oak','Walnut'], ARRAY['Custom to room']),
    (v_store_id, v_cat_wood, 'Floating TV Unit', 'floating-tv-unit', 'Minimalist wall-mounted media console.', 'A sleek, wall-mounted TV unit with concealed cable management and soft-close storage — designed to complement modern living rooms.', 'From ₦220,000', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80'], true, true, 7, ARRAY['MDF + Laminate','Veneer'], ARRAY['Matte White','Oak','Walnut'], ARRAY['1.8m','2.2m','2.6m','Custom']),
    (v_store_id, v_cat_concrete, 'Decorative Concrete Planter', 'decorative-concrete-planter', 'Weatherproof planter for outdoor landscaping.', 'Hand-finished decorative concrete planters — durable, weatherproof, and available in a range of sizes and textures for landscaping projects.', 'From ₦65,000', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80', ARRAY['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80'], true, false, 8, ARRAY['Polished Concrete','Textured Concrete'], ARRAY['Charcoal','Sandstone','Off-White'], ARRAY['Small','Medium','Large','Custom']);

  -- ── Services ─────────────────────────────────────────────────────
  INSERT INTO services (store_id, name, slug, short_description, description, icon, image_url, benefits, is_active, sort_order) VALUES
    (v_store_id, 'Metal Fabrication', 'metal-fabrication', 'Custom gates, doors, railings, and structural steelwork.', 'Our metal fabrication team designs and builds custom gates, security doors, railings, staircases, and structural steel — engineered for strength and finished to a premium standard.', '🔩', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80', ARRAY['Precision CNC cutting & welding','Corrosion-resistant powder coating','Custom sizing for any opening','Structural-grade steel & aluminium'], true, 1),
    (v_store_id, 'Aluminium & Glass', 'aluminium-glass', 'Windows, shopfronts, partitions, and glass doors.', 'From residential windows to full commercial shopfronts, we design and install aluminium and glass systems that balance natural light, security, and energy efficiency.', '🪟', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80', ARRAY['Slim, modern aluminium profiles','Tempered & laminated safety glass','Weatherproof sealing','Sliding, casement & frameless options'], true, 2),
    (v_store_id, 'Woodworking', 'woodworking', 'Bespoke cabinetry, wardrobes, and furniture.', 'Our joinery workshop builds bespoke kitchen cabinetry, wardrobes, office furniture, and feature woodwork — combining traditional craftsmanship with modern finishes.', '🪵', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80', ARRAY['Made-to-measure joinery','Soft-close hardware as standard','Wide range of finishes & veneers','In-house design consultation'], true, 3),
    (v_store_id, 'Decorative Concrete', 'decorative-concrete', 'Planters, benches, and landscape features.', 'We cast and finish decorative concrete pieces — planters, garden benches, pots, and landscape features — built to withstand the outdoors while looking refined.', '🪨', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&q=80', ARRAY['Weatherproof, UV-stable finishes','Custom moulds for unique designs','Polished, textured & pigmented options','Delivery & on-site placement'], true, 4),
    (v_store_id, 'Interior Fit-outs', 'interior-fit-outs', 'Complete interior design and build-out for any space.', 'From concept to completion, we handle full interior fit-outs for homes, offices, hospitality, and retail — partitions, flooring, ceilings, cabinetry, and finishes under one roof.', '🏠', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80', ARRAY['Single point of contact, start to finish','In-house design & 3D visualization','Coordinated trades & timelines','Post-handover support'], true, 5),
    (v_store_id, 'Installation & Maintenance', 'installation-maintenance', 'Professional installation and after-sales service.', 'Our installation crews handle everything we fabricate — plus ongoing maintenance contracts to keep gates, doors, glazing, and fittings working smoothly for years.', '🛠️', 'https://images.unsplash.com/photo-1581091870622-1c6d5eff0f2a?w=1200&q=80', ARRAY['Trained, insured installation teams','Scheduled maintenance plans','Rapid call-out for repairs','Warranty-backed workmanship'], true, 6);

  -- ── Projects (portfolio) ─────────────────────────────────────────
  INSERT INTO projects (store_id, title, slug, category, location, description, services_provided, images, is_featured, sort_order) VALUES
    (v_store_id, 'Lekki Residential Villa — Full Interior Fit-out', 'lekki-residential-villa-interior-fit-out', 'residential', 'Lekki, Lagos', 'A complete interior fit-out for a 5-bedroom villa, including custom kitchen cabinetry, wardrobes, aluminium windows, and decorative concrete landscaping.', ARRAY['Woodworking','Aluminium & Glass','Decorative Concrete','Interior Fit-outs'], ARRAY['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'], true, 1),
    (v_store_id, 'Victoria Island Office Tower — Partitions & Shopfront', 'victoria-island-office-tower-partitions', 'commercial', 'Victoria Island, Lagos', 'Frameless glass partitioning across four office floors, plus a full aluminium-and-glass shopfront for the ground-level retail units.', ARRAY['Aluminium & Glass','Metal Fabrication'], ARRAY['https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80'], true, 2),
    (v_store_id, 'Ikeja Boutique Hotel — Interiors & Fittings', 'ikeja-boutique-hotel-interiors', 'hotels', 'Ikeja, Lagos', 'Custom joinery and metal fittings for 40 guest rooms and common areas, including headboards, wardrobes, and decorative railings.', ARRAY['Woodworking','Metal Fabrication','Interior Fit-outs'], ARRAY['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80'], true, 3),
    (v_store_id, 'Private School Campus — Security Gates & Railings', 'private-school-campus-security-gates', 'schools', 'Abuja', 'Perimeter security gates, staircase railings, and window grilles for a new school campus, prioritizing safety without compromising on design.', ARRAY['Metal Fabrication'], ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80'], false, 4);

  -- ── Gallery ──────────────────────────────────────────────────────
  INSERT INTO gallery_items (store_id, title, media_type, media_url, thumbnail_url, filter_category, sort_order) VALUES
    (v_store_id, 'Powder-coated steel gate', 'image', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=480&q=80', 'metal', 1),
    (v_store_id, 'Aluminium shopfront glazing', 'image', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=480&q=80', 'aluminum_glass', 2),
    (v_store_id, 'Custom kitchen cabinetry', 'image', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=480&q=80', 'wood', 3),
    (v_store_id, 'Cast concrete garden planters', 'image', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=480&q=80', 'decorative_concrete', 4),
    (v_store_id, 'Open-plan office interior', 'image', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=480&q=80', 'interior', 5),
    (v_store_id, 'Landscaped villa exterior', 'image', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=480&q=80', 'exterior', 6);

  -- ── Blog ─────────────────────────────────────────────────────────
  INSERT INTO blog_posts (store_id, title, slug, excerpt, content, cover_image, category, author, is_published, published_at) VALUES
    (v_store_id, '5 Signs It''s Time to Replace Your Security Gate', '5-signs-time-to-replace-security-gate', 'Rust, sticking hinges, and outdated designs are more than cosmetic issues — here''s when to upgrade.', 'Full article content goes here — replace with real copy before publishing.', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80', 'Home Improvement Tips', 'Forge & Form Team', true, NOW() - INTERVAL '14 days'),
    (v_store_id, '2026 Interior Design Trends for Nigerian Homes', '2026-interior-design-trends-nigerian-homes', 'From warm minimalism to statement joinery — what we''re seeing on-site this year.', 'Full article content goes here — replace with real copy before publishing.', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80', 'Interior Trends', 'Forge & Form Team', true, NOW() - INTERVAL '5 days');

  -- ── Careers ──────────────────────────────────────────────────────
  INSERT INTO job_postings (store_id, title, slug, department, location, employment_type, description, requirements, is_internship, is_active) VALUES
    (v_store_id, 'Metal Fabrication Technician', 'metal-fabrication-technician', 'Production', 'Lagos', 'full_time', 'We''re looking for an experienced fabrication technician to join our metalwork team, working on gates, doors, railings, and custom structural pieces.', '3+ years welding/fabrication experience. Own PPE. Attention to detail.', false, true),
    (v_store_id, 'Interior Design Intern', 'interior-design-intern', 'Design', 'Lagos', 'internship', 'A 6-month internship for a design graduate to work alongside our interior fit-out team on real client projects.', 'Recent graduate or final-year student in Interior Design/Architecture. Proficient in AutoCAD or SketchUp.', true, true);

  -- ── Testimonials ─────────────────────────────────────────────────
  INSERT INTO testimonials (store_id, customer_name, customer_title, quote, rating, is_featured, sort_order) VALUES
    (v_store_id, 'Adaeze O.', 'Homeowner, Lekki', 'From the first site visit to the final installation, the team was professional and the finish quality exceeded what we expected. Our kitchen looks incredible.', 5, true, 1),
    (v_store_id, 'Tunde B.', 'Facilities Manager, VI Office Tower', 'They handled our entire glass partition project across four floors with zero disruption to our tenants. Highly recommend for commercial work.', 5, true, 2),
    (v_store_id, 'Grace M.', 'Hotel Owner, Ikeja', 'The custom joinery for our guest rooms was exactly to spec and delivered on time. Great communication throughout the project.', 5, true, 3);

END $$;
