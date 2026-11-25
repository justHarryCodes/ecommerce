import Link from "next/link";
import { ArrowRight } from "lucide-react";
import IconArt, { TONES } from "./IconArt";
import type { PromoBanner } from "@/lib/site-content";

// Mid-page promo card (text + icon art, no photo). Whole card is one link.
export default function PromoTile({ promo }: { promo: PromoBanner }) {
  const t = TONES[promo.tone];
  return (
    <Link
      href={promo.cta.href}
      className="group relative flex min-h-[200px] items-center justify-between gap-4 overflow-hidden rounded-3xl p-6 sm:p-7 transition-transform duration-300 motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      style={{ background: t.background, color: t.fg }}
    >
      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: t.eyebrow }}>
          {promo.eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-extrabold leading-tight tracking-tight">{promo.title}</h3>
        <p className="mt-1.5 text-sm" style={{ color: t.muted }}>{promo.caption}</p>
        <span
          className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold"
          style={t.button}
        >
          {promo.cta.label}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
      <IconArt icons={promo.icons} tone={promo.tone} className="-mr-2 hidden sm:block" />
    </Link>
  );
}
