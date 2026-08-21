import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { clCard, clLogo } from "@/lib/cloudinary";
import ProductCard from "@/components/storefront/ProductCard";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import { PROCESS_STEPS, WHY_CHOOSE_US } from "@/lib/site-content";
import type { Service, Product, Project, Testimonial, ProjectCategory } from "@/types";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  hotels: "Hotels",
  schools: "Schools",
  offices: "Offices",
  restaurants: "Restaurants",
};

export default async function HomePage() {
  const company = await getCompany();
  const companyName = company?.name ?? "Forge & Form";
  const logoUrl = company?.logoUrl ?? company?.logo_url ?? null;

  const [services, featuredProducts, featuredProjects, testimonials] = company
    ? await Promise.all([
        query<Service>(`SELECT * FROM services WHERE store_id = $1 AND is_active = true ORDER BY sort_order, name LIMIT 6`, [company.id]),
        query<Product>(`SELECT * FROM products WHERE store_id = $1 AND is_active = true AND is_featured = true ORDER BY sort_order LIMIT 8`, [company.id]),
        query<Project>(`SELECT * FROM projects WHERE store_id = $1 AND is_featured = true ORDER BY sort_order LIMIT 4`, [company.id]),
        query<Testimonial>(`SELECT * FROM testimonials WHERE store_id = $1 AND is_featured = true ORDER BY sort_order LIMIT 6`, [company.id]),
      ])
    : [[], [], [], []];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "#1a1410" }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at 20% 20%, var(--accent), transparent 55%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          {logoUrl && (
            <img src={clLogo(logoUrl)} alt={companyName} className="h-14 w-auto mx-auto mb-8 object-contain" />
          )}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Design. Fabricate. Build.
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg text-white/70">
            {company?.description ??
              "Integrated fabrication and interior solutions — metalwork, aluminium & glass, woodworking, decorative concrete, and complete interior fit-outs, from consultation to installation."}
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <QuoteRequestButton sourceType="general" label="Get a Free Quote" size="lg" />
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold border border-white/25 text-white transition-colors hover:bg-white/10"
            >
              View Our Projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About teaser */}
      {company?.description && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
            About {companyName}
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {company.description}
          </p>
          <Link href="/about" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--accent)" }}>
            Learn more <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>Our Services</h2>
            <Link href="/services" className="text-sm font-semibold shrink-0" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.slug}`}
                className="group flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4" style={{ background: "var(--accent-light)" }}>
                  {s.icon ?? "🛠️"}
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</h3>
                {(s.short_description ?? s.shortDescription) && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {s.short_description ?? s.shortDescription}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-16" style={{ background: "var(--bg-secondary)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>Featured Products</h2>
              <Link href="/products" className="text-sm font-semibold shrink-0" style={{ color: "var(--accent)" }}>View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Our Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-black mb-10 text-center" style={{ color: "var(--text-primary)" }}>
          Our Process
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS_STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white mb-4"
                style={{ background: "var(--accent)" }}
              >
                {i + 1}
              </div>
              <step.icon className="h-6 w-6 mb-3" style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-black mb-10 text-center" style={{ color: "var(--text-primary)" }}>
            Why Choose Us
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {WHY_CHOOSE_US.map(({ title, icon: Icon }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--accent-light)" }}>
                  <Icon className="h-6 w-6" style={{ color: "var(--accent-dark)" }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured projects */}
      {featuredProjects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>Recent Projects</h2>
            <Link href="/projects" className="text-sm font-semibold shrink-0" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <section className="py-16" style={{ background: "var(--bg-secondary)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-black mb-10 text-center" style={{ color: "var(--text-primary)" }}>
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
