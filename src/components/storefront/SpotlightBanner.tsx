import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cl } from "@/lib/cloudinary";
import { formatCurrency } from "@/lib/utils";
import { productDisplay } from "@/lib/product-display";
import { SPOTLIGHT_FALLBACK } from "@/lib/site-content";
import IconArt, { TONES } from "./IconArt";
import type { Product } from "@/types";

// Wide dark banner. With a product: copy left, photo centre, big saving
// figure right. Without one: the text + icon-art fallback from site-content.
export default function SpotlightBanner({ product }: { product: Product | null }) {
  const d = product ? productDisplay(product) : null;

  if (!product || !d?.image) {
    const promo = SPOTLIGHT_FALLBACK;
    const t = TONES[promo.tone];
    return (
      <section
        className="relative flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden rounded-[28px] px-6 py-10 sm:px-12 sm:py-12"
        style={{ background: t.background, color: t.fg }}
      >
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: t.eyebrow }}>{promo.eyebrow}</p>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight">{promo.title}</h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: t.muted }}>{promo.caption}</p>
          <Link
            href={promo.cta.href}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={t.button}
          >
            {promo.cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <IconArt icons={promo.icons} tone={promo.tone} size="lg" className="hidden md:block" />
      </section>
    );
  }

  const href = `/products/${product.slug}`;
  return (
    <section
      className="relative grid items-center gap-6 overflow-hidden rounded-[28px] px-6 py-10 sm:px-12 lg:grid-cols-[1fr_1.1fr_auto] lg:py-6"
      style={{
        background: "radial-gradient(60% 120% at 55% 50%, rgba(181,98,42,0.38) 0%, transparent 60%), var(--ink)",
        color: "var(--ink-foreground)",
      }}
    >
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent-light)" }}>
          Spotlight
        </p>
        <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight">{product.name}</h2>
        {d.shortDescription && (
          <p className="mt-3 text-sm sm:text-base line-clamp-2" style={{ color: "var(--ink-muted)" }}>{d.shortDescription}</p>
        )}
        <p className="mt-4 text-lg font-bold">
          {d.price !== null ? formatCurrency(d.price) : d.priceNote ?? "Price on request"}
          {d.comparePrice !== null && (
            <span className="ml-2 text-sm font-medium line-through" style={{ color: "var(--ink-muted)" }}>
              {formatCurrency(d.comparePrice)}
            </span>
          )}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
          style={{ color: "var(--ink)" }}
        >
          {d.purchasable ? "Shop now" : "View details"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] lg:-my-2 lg:rotate-[-2deg]">
          <img
            src={cl(d.image, "f_auto,q_auto:good,c_fill,w_800,h_600")}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {d.discountPct !== null && (
        <div className="text-center lg:text-right">
          <span className="sr-only">Save {d.discountPct}%</span>
          <p
            className="bg-clip-text text-7xl sm:text-8xl font-black leading-none tracking-tighter text-transparent"
            style={{ backgroundImage: "linear-gradient(180deg, var(--accent-light) 0%, var(--accent) 100%)" }}
            aria-hidden="true"
          >
            {d.discountPct}%
          </p>
          <p className="mt-1 text-2xl font-black tracking-widest" style={{ color: "var(--accent-light)" }} aria-hidden="true">
            OFF
          </p>
        </div>
      )}
    </section>
  );
}
