import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Truck, Clock, ShieldCheck, Lock, Wrench, MessageCircle, Check } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { formatCurrency, waLink } from "@/lib/utils";
import { productDisplay, toNum } from "@/lib/product-display";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductCard from "@/components/storefront/ProductCard";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import AddToCartPanel from "@/components/storefront/AddToCartPanel";
import SectionHeader from "@/components/storefront/SectionHeader";
import FeatureStrip from "@/components/storefront/FeatureStrip";
import type { Product } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params;
  const company = await getCompany();
  if (!company) return {};
  const product = await queryOne<Product>(
    `SELECT name, short_description FROM products WHERE store_id = $1 AND slug = $2 AND is_active = true`,
    [company.id, productSlug]
  );
  return {
    title: product?.name ?? "Product",
    description: product?.short_description ?? undefined,
  };
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

  // Same category first, then fill up with featured items.
  const relatedProducts = await query<Product>(
    `SELECT * FROM products
     WHERE store_id = $1 AND id != $2 AND is_active = true
     ORDER BY (category_id IS NOT DISTINCT FROM $3) DESC, is_featured DESC, sort_order
     LIMIT 5`,
    [company.id, product.id, product.category_id ?? null]
  );

  const d = productDisplay(product);
  const images = product.images && product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [];
  const sizeOptions = product.size_options ?? product.sizeOptions ?? [];
  const materialOptions = product.material_options ?? product.materialOptions ?? [];
  const colorOptions = product.color_options ?? product.colorOptions ?? [];
  const deliveryWithinState = toNum(product.deliveryFeeWithinState ?? product.delivery_fee_within_state) ?? 0;
  const deliveryInterstate = toNum(product.deliveryFeeInterstate ?? product.delivery_fee_interstate) ?? 0;
  const deliveryTimeline = product.deliveryTimeline ?? product.delivery_timeline;
  const whatsapp = company.whatsapp;
  const waMessage = d.purchasable
    ? `Hi, I'd like to order ${product.name}.`
    : `Hi, I'm interested in ${product.name} — can you send me a quote?`;

  // Delivery & assurance rows — only facts we actually have for this product.
  const infoRows: { icon: typeof Truck; title: string; detail: string }[] = [];
  if (d.freeDelivery) {
    infoRows.push({ icon: Truck, title: "Free delivery", detail: "No delivery charge on this item" });
  } else if (deliveryWithinState > 0 || deliveryInterstate > 0) {
    const parts = [
      deliveryWithinState > 0 ? `Within state ${formatCurrency(deliveryWithinState)}` : null,
      deliveryInterstate > 0 ? `Outside state ${formatCurrency(deliveryInterstate)}` : null,
    ].filter(Boolean);
    infoRows.push({ icon: Truck, title: "Delivery", detail: parts.join(" · ") });
  }
  if (deliveryTimeline) {
    // Some products store just a number ("5") — read that as business days.
    const detail = /^\d+(\s*[-–]\s*\d+)?$/.test(deliveryTimeline.trim())
      ? `${deliveryTimeline.trim()} business days`
      : deliveryTimeline;
    infoRows.push({ icon: Clock, title: "Estimated delivery", detail });
  }
  infoRows.push({ icon: Wrench, title: "Installation available", detail: "Our team can fit it on site on request" });
  infoRows.push({ icon: ShieldCheck, title: "Warranty support", detail: "Backed after handover" });
  if (d.purchasable) {
    const pref = company.paymentPreference ?? "paystack";
    const payDetail =
      pref === "both" ? "Pay by card or bank transfer" : pref === "bank_transfer" ? "Pay by bank transfer" : "Pay securely by card";
    infoRows.push({ icon: Lock, title: "Secure checkout", detail: payDetail });
  }

  return (
    <div className="pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link href="/products" className="hover:underline">Products</Link></li>
            {product.category_name && (
              <>
                <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
                <li>
                  <Link href={`/products?category=${product.category_slug}`} className="hover:underline">
                    {product.category_name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="max-w-[16rem] truncate font-medium" style={{ color: "var(--text-primary)" }}>
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <ProductGallery images={images} name={product.name} badge={d.discountPct ? `-${d.discountPct}%` : null} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              {product.category_name && (
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ background: "var(--well)", color: "var(--accent-dark)" }}
                >
                  {product.category_name}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                style={
                  d.purchasable
                    ? d.outOfStock
                      ? { background: "#fee2e2", color: "#991b1b" }
                      : { background: "#dcfce7", color: "#166534" }
                    : { background: "var(--well)", color: "var(--text-primary)" }
                }
              >
                {d.purchasable ? (d.outOfStock ? "Out of stock" : <><Check className="h-3 w-3" aria-hidden="true" /> In stock</>) : "Made to order"}
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>
              {product.name}
            </h1>
            {d.shortDescription && (
              <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{d.shortDescription}</p>
            )}

            {/* Price */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {d.price !== null ? formatCurrency(d.price) : d.priceNote ?? "Price on request"}
              </p>
              {d.comparePrice !== null && (
                <>
                  <span className="text-lg line-through" style={{ color: "var(--text-secondary)" }}>
                    <span className="sr-only">Was </span>{formatCurrency(d.comparePrice)}
                  </span>
                  <span className="rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: "var(--accent-light)", color: "var(--accent-dark)" }}>
                    Save {formatCurrency(d.comparePrice - (d.price ?? 0))}
                  </span>
                </>
              )}
            </div>
            {d.price !== null && d.priceNote && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{d.priceNote}</p>
            )}

            {/* Options */}
            {(sizeOptions.length > 0 || materialOptions.length > 0 || colorOptions.length > 0) && (
              <div className="mt-7 space-y-5 border-t pt-6" style={{ borderColor: "var(--border)" }}>
                {sizeOptions.length > 0 && <OptionRow label="Available sizes" options={sizeOptions} />}
                {materialOptions.length > 0 && <OptionRow label="Materials" options={materialOptions} />}
                {colorOptions.length > 0 && <OptionRow label="Colours" options={colorOptions} />}
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Need a different size or finish? Mention it in your order note or quote request.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-7 space-y-3 border-t pt-6" style={{ borderColor: "var(--border)" }}>
              {d.purchasable ? (
                <AddToCartPanel product={product} />
              ) : (
                <QuoteRequestButton
                  sourceType="product"
                  sourceId={product.id}
                  sourceName={product.name}
                  label="Request a quote"
                  size="lg"
                  className="h-12 w-full rounded-full bg-[var(--ink)] text-[var(--ink-foreground)] hover:bg-[var(--ink-soft)] focus-visible:ring-[var(--accent)]"
                />
              )}
              {whatsapp && (
                <a
                  href={waLink(whatsapp, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-bold transition-colors hover:bg-[var(--well)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
                </a>
              )}
            </div>

            {/* Delivery & assurance */}
            <ul className="mt-6 divide-y rounded-2xl border" style={{ borderColor: "var(--border)" }}>
              {infoRows.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderColor: "var(--border)" }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--well)", color: "var(--accent-dark)" }}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Details */}
        {product.description && (
          <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-14 border-t pt-10" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Product details</h2>
            <p className="whitespace-pre-line text-[15px] leading-7" style={{ color: "var(--text-secondary)" }}>
              {product.description}
            </p>
          </section>
        )}

        <section className="mt-12">
          <FeatureStrip />
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-14">
            <SectionHeader title="You may also like" href="/products" linkLabel="View all products" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function OptionRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <li
            key={opt}
            className="rounded-full border px-3.5 py-1.5 text-sm font-medium"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
          >
            {opt}
          </li>
        ))}
      </ul>
    </div>
  );
}
