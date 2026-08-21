import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { clBanner } from "@/lib/cloudinary";
import ProductCard from "@/components/storefront/ProductCard";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import type { Service, Product } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany();
  if (!company) return {};
  const service = await queryOne<Service>(
    `SELECT * FROM services WHERE store_id = $1 AND slug = $2 AND is_active = true`,
    [company.id, slug]
  );
  return { title: service?.name ?? "Service" };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany();
  if (!company) notFound();

  const service = await queryOne<Service>(
    `SELECT * FROM services WHERE store_id = $1 AND slug = $2 AND is_active = true`,
    [company.id, slug]
  );
  if (!service) notFound();

  const relatedProductIds = service.related_product_ids ?? service.relatedProductIds ?? [];
  const relatedProducts = relatedProductIds.length > 0
    ? await query<Product>(
        `SELECT * FROM products WHERE store_id = $1 AND id = ANY($2::uuid[]) AND is_active = true`,
        [company.id, relatedProductIds]
      )
    : [];

  const benefits = service.benefits ?? [];
  const imageUrl = service.image_url ?? service.imageUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-1.5 text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        <Link href="/services" className="hover:opacity-70">Services</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span style={{ color: "var(--text-primary)" }}>{service.name}</span>
      </nav>

      {imageUrl && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-[21/9]" style={{ background: "var(--bg-tertiary)" }}>
          <img src={clBanner(imageUrl)} alt={service.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{service.icon ?? "🛠️"}</span>
        <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          {service.name}
        </h1>
      </div>

      {service.description && (
        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
          {service.description}
        </p>
      )}

      {benefits.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            What&apos;s included
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <QuoteRequestButton sourceType="service" sourceId={service.id} sourceName={service.name} label="Request Quote" size="lg" />

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-black mb-6" style={{ color: "var(--text-primary)" }}>
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
