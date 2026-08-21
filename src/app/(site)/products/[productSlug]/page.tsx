import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { formatCurrency, waLink } from "@/lib/utils";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductCard from "@/components/storefront/ProductCard";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import type { Product } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params;
  const company = await getCompany();
  if (!company) return {};
  const product = await queryOne<Product>(
    `SELECT * FROM products WHERE store_id = $1 AND slug = $2 AND is_active = true`,
    [company.id, productSlug]
  );
  return { title: product?.name ?? "Product" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params;
  const company = await getCompany();
  if (!company) notFound();

  const product = await queryOne<Product & { category_name?: string; category_slug?: string }>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.store_id = $1 AND p.slug = $2 AND p.is_active = true`,
    [company.id, productSlug]
  );
  if (!product) notFound();

  const relatedProducts = product.category_id
    ? await query<Product>(
        `SELECT * FROM products WHERE store_id = $1 AND category_id = $2 AND id != $3 AND is_active = true ORDER BY sort_order LIMIT 4`,
        [company.id, product.category_id, product.id]
      )
    : [];

  const images = product.images && product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [];
  const price = product.price;
  const priceNote = product.price_note ?? product.priceNote;
  const sizeOptions = product.size_options ?? product.sizeOptions ?? [];
  const materialOptions = product.material_options ?? product.materialOptions ?? [];
  const colorOptions = product.color_options ?? product.colorOptions ?? [];
  const whatsapp = company.whatsapp;
  const waMessage = `Hi, I'm interested in ${product.name} — can you send me a quote?`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-8 flex-wrap" style={{ color: "var(--text-secondary)" }}>
        <Link href="/products" className="hover:opacity-70">Products</Link>
        {product.category_name && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/products?category=${product.category_slug}`} className="hover:opacity-70">
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span style={{ color: "var(--text-primary)" }}>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={images} name={product.name} />

        <div>
          {product.category_name && (
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
              {product.category_name}
            </span>
          )}
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            {product.name}
          </h1>

          <p className="mt-3 text-xl font-black" style={{ color: "var(--accent)" }}>
            {price != null ? formatCurrency(price) : priceNote ?? "Request a quote"}
          </p>

          {product.description && (
            <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {product.description}
            </p>
          )}

          <div className="mt-6 space-y-4">
            {sizeOptions.length > 0 && (
              <OptionRow label="Available sizes" options={sizeOptions} />
            )}
            {materialOptions.length > 0 && (
              <OptionRow label="Materials" options={materialOptions} />
            )}
            {colorOptions.length > 0 && (
              <OptionRow label="Colors" options={colorOptions} />
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <QuoteRequestButton
              sourceType="product"
              sourceId={product.id}
              sourceName={product.name}
              size="lg"
              className="w-full sm:w-auto"
            />
            {whatsapp && (
              <a
                href={waLink(whatsapp, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold border transition-colors hover:opacity-80"
                style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
              >
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

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

function OptionRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <span
            key={opt}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}
