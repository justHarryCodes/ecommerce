import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import type { PromoTone } from "@/lib/site-content";

// Colour treatment for text-only promo banners. Copper uses the darker end
// of the accent so white body text keeps AA contrast.
export const TONES: Record<PromoTone, {
  background: string;
  fg: string;
  muted: string;
  eyebrow: string;
  chip: string;
  chipFg: string;
  button: CSSProperties;
}> = {
  ink: {
    background: "radial-gradient(120% 140% at 85% 20%, rgba(181,98,42,0.35) 0%, transparent 55%), var(--ink)",
    fg: "var(--ink-foreground)",
    muted: "var(--ink-muted)",
    eyebrow: "var(--accent-light)",
    chip: "rgba(255,255,255,0.08)",
    chipFg: "var(--accent-light)",
    button: { background: "var(--accent)", color: "#fff" },
  },
  copper: {
    background: "radial-gradient(120% 140% at 85% 15%, rgba(255,255,255,0.14) 0%, transparent 50%), linear-gradient(135deg, var(--accent-dark) 0%, #9a4c1d 100%)",
    fg: "#fff",
    muted: "rgba(255,255,255,0.85)",
    eyebrow: "var(--accent-light)",
    chip: "rgba(255,255,255,0.14)",
    chipFg: "#fff",
    button: { background: "#fff", color: "var(--accent-dark)" },
  },
  sand: {
    background: "radial-gradient(120% 140% at 85% 15%, rgba(181,98,42,0.16) 0%, transparent 55%), var(--well-strong)",
    fg: "var(--text-primary)",
    muted: "#57534e",
    eyebrow: "var(--accent-dark)",
    chip: "rgba(124,63,22,0.10)",
    chipFg: "var(--accent-dark)",
    button: { background: "var(--ink)", color: "var(--ink-foreground)" },
  },
};

interface Props {
  icons: LucideIcon[];
  tone: PromoTone;
  size?: "md" | "lg";
  className?: string;
}

// Decorative icon composition used in place of photos on promo banners:
// one large hero icon in a ringed disc, with smaller satellites around it.
// Purely decorative — hidden from assistive tech.
export default function IconArt({ icons, tone, size = "md", className = "" }: Props) {
  const t = TONES[tone];
  const [Main, ...rest] = icons;
  if (!Main) return null;
  const big = size === "lg";
  const satellites = [
    big ? "top-0 left-2" : "top-0 left-0",
    big ? "bottom-2 left-0" : "bottom-0 left-3",
    big ? "top-6 right-0" : "top-2 right-0",
  ];

  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 ${big ? "h-64 w-64 lg:h-80 lg:w-80" : "h-32 w-32"} ${className}`}
    >
      {/* Rings */}
      <div className="absolute inset-[8%] rounded-full border" style={{ borderColor: t.chip }} />
      <div className="absolute inset-[22%] rounded-full border border-dashed" style={{ borderColor: t.chip }} />

      {/* Main disc */}
      <div
        className="sf-float absolute inset-[28%] flex items-center justify-center rounded-full shadow-2xl"
        style={{ background: t.chip, color: t.chipFg, backdropFilter: "blur(4px)" }}
      >
        <Main className={big ? "h-16 w-16 lg:h-20 lg:w-20" : "h-9 w-9"} strokeWidth={1.4} />
      </div>

      {/* Satellites */}
      {rest.slice(0, 3).map((Icon, i) => (
        <div
          key={i}
          className={`${i % 2 ? "sf-float-delay" : "sf-float"} absolute ${satellites[i]} flex items-center justify-center rounded-2xl`}
          style={{
            background: t.chip,
            color: t.chipFg,
            width: big ? 64 : 34,
            height: big ? 64 : 34,
          }}
        >
          <Icon className={big ? "h-7 w-7" : "h-4 w-4"} strokeWidth={1.6} />
        </div>
      ))}
    </div>
  );
}
