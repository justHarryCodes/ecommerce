import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Star,
  ChevronRight,
  Info,
  Wrench,
  Briefcase,
  Image as ImageIcon,
  Newspaper,
  UserPlus,
  Hammer,
  Layers,
  TreePine,
  Package,
  type LucideIcon,
} from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { getHeroCollageImages } from "@/lib/hero-images";
import { clCard } from "@/lib/cloudinary";
import ProductCard from "@/components/storefront/ProductCard";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import { WHY_CHOOSE_US } from "@/lib/site-content";
import type { Product, Project, Testimonial, ProjectCategory, Category } from "@/types";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  hotels: "Hotels",
  schools: "Schools",
  offices: "Offices",
  restaurants: "Restaurants",
};

// Quick-nav tiles flanking the hero (desktop: 3 left + 3 right; mobile: one
// horizontal-scroll row below the hero). Products/Contact are deliberately
// left out — Products is the page's own focus just below, and Contact
// already has the hero's CTA button.
const NAV_TILES: { href: string; label: string; desc: string; icon: LucideIcon }[] = [
  { href: "/about", label: "About Us", desc: "Our story & mission", icon: Info },
  { href: "/services", label: "Services", desc: "What we do", icon: Wrench },
  { href: "/projects", label: "Projects", desc: "Our portfolio", icon: Briefcase },
  { href: "/gallery", label: "Gallery", desc: "Photos & videos", icon: ImageIcon },
  { href: "/blog", label: "Blog", desc: "Tips & insights", icon: Newspaper },
  { href: "/careers", label: "Careers", desc: "Join our team", icon: UserPlus },
];
const leftTiles = NAV_TILES.slice(0, 3);
const rightTiles = NAV_TILES.slice(3, 6);

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "metal-products": Hammer,
  "aluminum-glass": Layers,
  "wood-products": TreePine,
  "decorative-concrete": Package,
};

// Shared markup for the three admin-curated homepage product placements —
// Sponsored, Featured, Top Selling all render identically, just fed by a
// different `is_*` flag on the product (checked in the dashboard product
// form under "Homepage placement").
function ProductRow({ title, products, alt = false }: { title: string; products: Product[]; alt?: boolean }) {
  if (products.length === 0) return null;
  return (
    <section className="py-12" style={alt ? { background: "var(--bg-secondary)" } : undefined}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-black" style={{ color: "var(--text-primary)" }}>{title}</h2>
          <Link href="/products" className="text-sm font-semibold shrink-0" style={{ color: "var(--accent)" }}>Shop all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NavTile({ href, label, desc, icon: Icon, className = "" }: {
  href: string; label: string; desc: string; icon: LucideIcon; className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--accent)" }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white truncate">{label}</p>
        <p className="text-xs text-white/60 truncate">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

export default async function HomePage() {
  const company = await getCompany();

  const [categories, featuredProducts, topSellingProducts, sponsoredProducts, featuredProjects, testimonials, heroImages] = company
    ? await Promise.all([
        query<Category>(`SELECT * FROM categories WHERE store_id = $1 AND parent_id IS NULL ORDER BY sort_order, name`, [company.id]),
        query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_featured = true ORDER BY sort_order LIMIT 8`, [company.id]),
        query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_top_selling = true ORDER BY sort_order LIMIT 8`, [company.id]),
        query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_sponsored = true ORDER BY sort_order LIMIT 8`, [company.id]),
        query<Project>(`SELECT * FROM projects WHERE store_id = $1 AND is_featured = true ORDER BY sort_order LIMIT 3`, [company.id]),
        query<Testimonial>(`SELECT * FROM testimonials WHERE store_id = $1 AND is_featured = true ORDER BY sort_order LIMIT 6`, [company.id]),
        getHeroCollageImages(8),
      ])
    : [[], [], [], [], [], [], []];

  const heroCollage = heroImages.length > 0
    ? Array.from({ length: 8 }, (_, i) => heroImages[i % heroImages.length])
    : [];

  // Minimal, centered — just the headline and the two CTAs.
  const heroContent = (
    <div className="text-center px-2">
      <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
        Design. Fabricate. Build.
      </h1>
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        <QuoteRequestButton sourceType="general" label="Get a Free Quote" size="lg" />
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold border border-white/25 text-white transition-colors hover:bg-white/10"
        >
          View Our Projects <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      {/* Hero + quick-nav tiles — photo-collage background, minimal centered text */}
      <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] flex items-center" style={{ background: "#1a1410" }}>
        {heroCollage.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-4 sm:grid-cols-8 gap-0.5">
            {heroCollage.map((img, i) => (
              <div key={i} className="relative overflow-hidden">
                <img src={clCard(img)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(20,15,10,0.72) 0%, rgba(20,15,10,0.82) 100%)" }}
        />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          {/* Desktop: 3-column layout — tiles flank the hero */}
          <div className="hidden lg:grid grid-cols-[240px_1fr_240px] gap-8 items-center">
            <div className="flex flex-col gap-4">
              {leftTiles.map((t) => <NavTile key={t.href} {...t} />)}
            </div>
            {heroContent}
            <div className="flex flex-col gap-4">
              {rightTiles.map((t) => <NavTile key={t.href} {...t} />)}
            </div>
          </div>

          {/* Mobile/tablet: hero on top, tiles as a horizontal-scroll row below */}
          <div className="lg:hidden">
            {heroContent}
            <div className="mt-8 -mx-4 px-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV_TILES.map((t) => (
                <NavTile key={t.href} {...t} className="w-40 shrink-0 snap-start" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shop by category */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl sm:text-2xl font-black mb-6" style={{ color: "var(--text-primary)" }}>
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug] ?? Package;
              return (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="group flex flex-col items-center text-center gap-3 rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--accent-light)" }}>
                    <Icon className="h-6 w-6" style={{ color: "var(--accent-dark)" }} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Admin-curated homepage placements — each toggled per product from
          the dashboard product form ("Homepage placement" checkboxes). */}
      <ProductRow title="Sponsored Products" products={sponsoredProducts} />
      <ProductRow title="Featured Products" products={featuredProducts} alt />
      <ProductRow title="Top Selling" products={topSellingProducts} />

      {/* Trust badges — compact, not a full showcase section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {WHY_CHOOSE_US.map(({ title, icon: Icon }) => (
            <div key={title} className="flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent projects — compact proof of work */}
      {featuredProjects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black" style={{ color: "var(--text-primary)" }}>Recent Projects</h2>
            <Link href="/projects" className="text-sm font-semibold shrink-0" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featuredProjects.map((p) => {
              const image = p.images?.[0];
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                >
                  <div className="aspect-[4/3] overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                    {image ? (
                      <img src={clCard(image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏗️</div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                    <h3 className="mt-1.5 text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h3>
                    {p.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <MapPin className="h-3.5 w-3.5" /> {p.location}
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
        <section className="py-12" style={{ background: "var(--bg-secondary)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-black mb-8 text-center" style={{ color: "var(--text-primary)" }}>
              What Our Clients Say
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => {
                const name = t.customer_name ?? t.customerName;
                const title = t.customer_title ?? t.customerTitle;
                const rating = t.rating ?? 5;
                return (
                  <div key={t.id} className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4" fill={i < rating ? "var(--accent)" : "none"} style={{ color: "var(--accent)" }} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{name}</p>
                    {title && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{title}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="relative overflow-hidden" style={{ background: "#1a1410" }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at 80% 50%, var(--accent), transparent 55%)" }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Let&apos;s Build Something Amazing Together
          </h2>
          <p className="mt-4 text-base text-white/70">
            Tell us about your project and we&apos;ll get back to you with a free, no-obligation quote.
          </p>
          <div className="mt-8 flex justify-center">
            <QuoteRequestButton sourceType="general" label="Request a Quote" size="lg" />
          </div>
        </div>
      </section>
    </div>
  );
}
