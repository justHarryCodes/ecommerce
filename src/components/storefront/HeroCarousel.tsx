"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Tag } from "lucide-react";
import { cl } from "@/lib/cloudinary";
import { formatCurrency } from "@/lib/utils";
import { HERO_PROMOS, type PromoBanner } from "@/lib/site-content";
import IconArt, { TONES } from "./IconArt";

// Serializable product data for a hero slide (built server-side from the DB).
export interface HeroProductSlide {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string | null;
  caption: string | null;
  price: number | null;
  comparePrice: number | null;
  discountPct: number | null;
  priceNote: string | null;
  purchasable: boolean;
}

type Slide =
  | { kind: "product"; key: string; product: HeroProductSlide }
  | { kind: "promo"; key: string; promo: PromoBanner };

const INTERVAL_MS = 6500;

// Interleave: product, promo, product, promo… so text banners break up
// the photo slides. Falls back gracefully to all-promo or all-product.
function buildSlides(products: HeroProductSlide[]): Slide[] {
  const out: Slide[] = [];
  const max = Math.max(products.length, HERO_PROMOS.length);
  for (let i = 0; i < max; i++) {
    if (products[i]) out.push({ kind: "product", key: `p-${products[i].id}`, product: products[i] });
    if (HERO_PROMOS[i]) out.push({ kind: "promo", key: `promo-${i}`, promo: HERO_PROMOS[i] });
  }
  return out;
}

const heroImg = (url: string) => cl(url, "f_auto,q_auto:good,c_fill,w_960,h_820");

export default function HeroCarousel({ products }: { products: HeroProductSlide[] }) {
  const slides = buildSlides(products);
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const autoplay = playing && !hovered && !focused && !reducedMotion && count > 1;
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(() => go(active + 1), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [autoplay, active, go]);

  if (count === 0) return null;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative overflow-hidden rounded-[28px]"
      style={{ background: "var(--well)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      {/* All slides share one grid cell, so the carousel is as tall as its
          tallest slide — no fixed heights, no layout jump between slides. */}
      <div className="grid">
        {slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!isActive}
              // Hidden slides must not be tabbable. Set `inert` on the DOM
              // node directly — React 18 and 19 disagree on the prop form.
              ref={(el) => {
                el?.toggleAttribute("inert", !isActive);
              }}
              // Outgoing slide fades out fast; incoming fades in just after,
              // on top — so the two slides' text never visibly overlaps.
              className={`[grid-area:1/1] transition-opacity ease-out motion-reduce:transition-none ${
                isActive
                  ? "relative z-10 opacity-100 duration-500 delay-150"
                  : "relative z-0 pointer-events-none opacity-0 duration-200"
              }`}
            >
              {slide.kind === "product" ? (
                <ProductSlide product={slide.product} eager={i === 0} />
              ) : (
                <PromoSlide promo={slide.promo} />
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {count > 1 && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 flex items-center gap-2 rounded-full bg-black/35 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous slide"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 px-1">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className="flex h-6 items-center justify-center px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
              >
                <span
                  className="block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none"
                  style={{
                    width: i === active ? 22 : 6,
                    background: i === active ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next slide"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Product slide: copy left, product photo right ───────────────────────────
function ProductSlide({ product: p, eager }: { product: HeroProductSlide; eager: boolean }) {
  const href = `/products/${p.slug}`;
  return (
    <div
      className="grid h-full items-center gap-6 lg:grid-cols-[1.05fr_1fr] pb-20 lg:pb-0"
      style={{
        background:
          "radial-gradient(90% 120% at 100% 0%, rgba(181,98,42,0.16) 0%, transparent 55%), linear-gradient(135deg, var(--well) 0%, var(--well-strong) 100%)",
      }}
    >
      {/* Photo first on mobile */}
      <div className="relative order-1 lg:order-2 px-4 pt-4 sm:px-8 sm:pt-8 lg:p-10 lg:pl-0">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl shadow-[0_30px_60px_-20px_rgba(23,18,14,0.45)] lg:aspect-[1/0.92]">
          <img
            src={heroImg(p.image)}
            alt={p.name}
            className="h-full w-full object-cover"
            loading={eager ? "eager" : "lazy"}
            decoding={eager ? "sync" : "async"}
            {...(eager ? ({ fetchPriority: "high" } as Record<string, string>) : {})}
          />
          {/* Floating chip — like a product tag on the photo */}
          <div className="absolute left-4 bottom-4 rounded-2xl bg-black/55 px-4 py-3 text-white backdrop-blur-md">
            <p className="text-[11px] font-medium text-white/75">{p.purchasable ? "Ready to order" : "Made to order"}</p>
            <p className="max-w-[14rem] truncate text-sm font-bold">{p.name}</p>
          </div>
          {p.discountPct && (
            <div
              className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold text-white shadow-lg"
              style={{ background: "var(--accent-dark)" }}
            >
              <Tag className="h-3.5 w-3.5" aria-hidden="true" /> Save {p.discountPct}%
            </div>
          )}
        </div>
      </div>

      <div className="order-2 lg:order-1 px-6 sm:px-10 lg:py-14 lg:pl-14">
        <p
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ background: "rgba(124,63,22,0.10)", color: "var(--accent-dark)" }}
        >
          Featured{p.category ? ` · ${p.category}` : ""}
        </p>
        <h2
          className="mt-4 text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.04] tracking-tight line-clamp-3"
          style={{ color: "var(--text-primary)" }}
        >
          {p.name}
        </h2>
        {p.caption && (
          <p className="mt-4 max-w-md text-base leading-relaxed line-clamp-2" style={{ color: "#57534e" }}>
            {p.caption}
          </p>
        )}
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            {p.price !== null ? formatCurrency(p.price) : p.priceNote ?? "Price on request"}
          </span>
          {p.comparePrice !== null && (
            <span className="text-base line-through" style={{ color: "var(--text-secondary)" }}>
              {formatCurrency(p.comparePrice)}
            </span>
          )}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{ background: "var(--ink)", color: "var(--ink-foreground)" }}
          >
            {p.purchasable ? "Shop now" : "View details"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-bold transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
          >
            Browse all products
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Promo slide: text + icon art, no photo ──────────────────────────────────
function PromoSlide({ promo }: { promo: PromoBanner }) {
  const t = TONES[promo.tone];
  return (
    <div
      className="flex h-full min-h-[440px] items-end md:items-center justify-between gap-8 px-6 pt-12 pb-24 sm:px-10 lg:px-14 lg:py-14"
      style={{ background: t.background, color: t.fg }}
    >
      <div className="max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: t.eyebrow }}>
          {promo.eyebrow}
        </p>
        <h2 className="mt-4 text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.04] tracking-tight">
          {promo.title}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: t.muted }}>
          {promo.caption}
        </p>
        <Link
          href={promo.cta.href}
          className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={t.button}
        >
          {promo.cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <IconArt icons={promo.icons} tone={promo.tone} size="lg" className="hidden md:block" />
    </div>
  );
}
