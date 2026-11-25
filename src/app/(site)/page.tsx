import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Star,
  Hammer,
  Layers,
  TreePine,
  Package,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { clCard } from "@/lib/cloudinary";
import { waLink } from "@/lib/utils";
import { productDisplay } from "@/lib/product-display";
import { PROMO_TILES } from "@/lib/site-content";
import ProductCard from "@/components/storefront/ProductCard";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import HeroCarousel, { type HeroProductSlide } from "@/components/storefront/HeroCarousel";
import SpotlightBanner from "@/components/storefront/SpotlightBanner";
import PromoTile from "@/components/storefront/PromoTile";
import SectionHeader from "@/components/storefront/SectionHeader";
import FeatureStrip from "@/components/storefront/FeatureStrip";
import type { Product, Project, Testimonial, ProjectCategory } from "@/types";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  hotels: "Hotels",
  schools: "Schools",
  offices: "Offices",
  restaurants: "Restaurants",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "metal-products": Hammer,
  "aluminum-glass": Layers,
  "wood-products": TreePine,
  "decorative-concrete": Package,
};

const HAS_IMAGE = `(cardinality(p.images) > 0 OR p.image_url IS NOT NULL)`;

type CategoryTile = { id: string; name: string; slug: string; cover: string | null };
type ProductWithCategory = Product & { category_name?: string | null };

const container = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

// Admin-curated product row (Featured / Top selling / Sponsored flags are
// ticked per product in the dashboard under "Homepage placement").
function ProductRow({ title, subtitle, products: all }: { title: string; subtitle?: string; products: Product[] }) {
  if (all.length === 0) return null;
  // Desktop shows 5 per row — trim to full rows so no lone card dangles.
  const products = all.length > 5 ? all.slice(0, Math.floor(all.length / 5) * 5) : all;
  return (
    <section className={`${container} py-10`}>
      <SectionHeader title={title} subtitle={subtitle} href="/products" linkLabel="View all products" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const company = await getCompany();
  const storeId = company?.id;

  const [categories, heroRows, featured, topSelling, sponsored, spotlightCandidates, featuredProjects, testimonials] =
    storeId
      ? await Promise.all([
          query<CategoryTile>(
            `SELECT c.id, c.name, c.slug,
               (SELECT COALESCE(p.images[1], p.image_url) FROM products p
                 WHERE p.store_id = c.store_id AND p.is_active = true
                   AND (p.category_id = c.id OR p.subcategory_id = c.id) AND ${HAS_IMAGE}
                 ORDER BY p.is_featured DESC, p.sort_order LIMIT 1) AS cover
             FROM categories c
             WHERE c.store_id = $1 AND c.parent_id IS NULL
             ORDER BY c.sort_order, c.name`,
            [storeId]
          ),
          query<ProductWithCategory>(
            `SELECT p.*, c.name AS category_name FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.store_id = $1 AND p.is_active = true AND (p.is_sponsored OR p.is_featured) AND ${HAS_IMAGE}
             ORDER BY p.is_sponsored DESC, p.sort_order LIMIT 3`,
            [storeId]
          ),
          query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_featured = true ORDER BY sort_order LIMIT 10`, [storeId]),
          query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_top_selling = true ORDER BY sort_order LIMIT 10`, [storeId]),
          query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_sponsored = true ORDER BY sort_order LIMIT 10`, [storeId]),
          // Spotlight: the curated product with the biggest real saving.
          query<Product>(
            `SELECT p.* FROM products p
             WHERE p.store_id = $1 AND p.is_active = true AND ${HAS_IMAGE}
               AND (p.is_sponsored OR p.is_featured OR p.is_top_selling)
             ORDER BY CASE WHEN p.compare_price > p.price AND p.compare_price > 0
                           THEN (p.compare_price - p.price) / p.compare_price END DESC NULLS LAST,
                      p.is_sponsored DESC, p.sort_order
             LIMIT 6`,
            [storeId]
          ),
          query<Project>(`SELECT * FROM projects WHERE store_id = $1 AND is_featured = true ORDER BY sort_order LIMIT 3`, [storeId]),
          query<Testimonial>(`SELECT * FROM testimonials WHERE store_id = $1 AND is_featured = true ORDER BY sort_order LIMIT 3`, [storeId]),
        ])
      : [[], [], [], [], [], [], [], []];

  const heroProducts: HeroProductSlide[] = heroRows.map((p) => {
    const d = productDisplay(p);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: d.image as string,
      category: p.category_name ?? null,
      caption: d.shortDescription,
      price: d.price,
      comparePrice: d.comparePrice,
      discountPct: d.discountPct,
      priceNote: d.priceNote,
      purchasable: d.purchasable,
    };
  });

  // Prefer a spotlight product that isn't already a hero slide.
  const heroIds = new Set(heroRows.map((p) => p.id));
  const spotlight = spotlightCandidates.find((p) => !heroIds.has(p.id)) ?? spotlightCandidates[0] ?? null;

  const whatsapp = company?.whatsapp;

  return (
    <div className="pb-4">
      <h1 className="sr-only">
        {company?.name ?? "Build&Funish"} — custom furniture, fabrication and interior fit-outs
      </h1>

      {/* Hero */}
      <section className={`${container} pt-4 sm:pt-6`}>
        <HeroCarousel products={heroProducts} />
      </section>

      {/* Shop by category */}
      {categories.length > 0 && (
        <section className={`${container} pt-12 pb-4`}>
          <SectionHeader title="Shop by category" href="/products" linkLabel="All products" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug] ?? Package;
              return (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="group w-[42%] shrink-0 snap-start sm:w-auto focus-visible:outline-none"
                >
                  <div
                    className="relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-2xl transition-shadow group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent)] group-focus-visible:ring-offset-2"
                    style={{ background: "var(--well)" }}
                  >
                    {c.cover ? (
                      <img
                        src={clCard(c.cover)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ color: "var(--accent-dark)" }}>
                        <Icon className="h-10 w-10" strokeWidth={1.4} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2.5 text-center text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {c.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <ProductRow title="Featured products" subtitle="Hand-picked from our workshop" products={featured} />

      {/* Promo tiles — text + icons, no photos */}
      <section className={`${container} py-6`}>
        <div className="grid gap-4 md:grid-cols-3">
          {PROMO_TILES.map((promo) => (
            <PromoTile key={promo.title} promo={promo} />
          ))}
        </div>
      </section>

      <ProductRow title="Best sellers" subtitle="What our customers order most" products={topSelling} />

      {/* Spotlight banner from the DB (falls back to a text promo) */}
      <section className={`${container} py-6`}>
        <SpotlightBanner product={spotlight} />
      </section>

      <ProductRow title="Sponsored" products={sponsored} />

      {/* Recent projects */}
      {featuredProjects.length > 0 && (
        <section className={`${container} py-10`}>
          <SectionHeader title="Recent projects" subtitle="Work we've designed, built and installed" href="/projects" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredProjects.map((p) => {
              const image = p.images?.[0];
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  style={{ background: "var(--well)" }}
                >
                  {image ? (
                    <img
                      src={clCard(image)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">🏗️</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                    <h3 className="mt-2 text-base font-bold">{p.title}</h3>
                    {p.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {p.location}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className={`${container} py-10`}>
          <SectionHeader title="What our clients say" />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => {
              const name = t.customer_name ?? t.customerName ?? "Client";
              const title = t.customer_title ?? t.customerTitle;
              const rating = Math.max(0, Math.min(5, t.rating ?? 5));
              const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <figure key={t.id} className="flex gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                    style={{ background: "var(--accent-light)", color: "var(--accent-dark)" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5" fill={i < rating ? "#d97706" : "none"} style={{ color: "#d97706" }} aria-hidden="true" />
                      ))}
                    </div>
                    <blockquote className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-3">
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{name}</p>
                      {title && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{title}</p>}
                    </figcaption>
                  </div>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* Assurance strip */}
      <section className={`${container} py-8`}>
        <FeatureStrip />
      </section>

      {/* CTA band */}
      <section className={`${container} pt-6 pb-10`}>
        <div
          className="relative overflow-hidden rounded-[28px] px-6 py-12 text-center sm:px-12 sm:py-16"
          style={{
            background:
              "radial-gradient(70% 120% at 50% 0%, rgba(181,98,42,0.4) 0%, transparent 60%), var(--ink)",
            color: "var(--ink-foreground)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent-light)" }}>
            Custom projects
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl sm:text-4xl font-extrabold tracking-tight">
            Let&apos;s build something great together
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: "var(--ink-muted)" }}>
            Tell us about your space and we&apos;ll come back with a free, no-obligation quote.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <QuoteRequestButton sourceType="general" label="Request a quote" size="lg" className="rounded-full" />
            {whatsapp ? (
              <a
                href={waLink(whatsapp, "Hi, I'd like to discuss a project.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-base font-semibold transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
              </a>
            ) : (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-base font-semibold transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See our projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
