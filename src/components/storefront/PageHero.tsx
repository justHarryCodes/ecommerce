import type { ReactNode } from "react";

interface Stat {
  label: string;
  value: string | number;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: Stat[];
  children?: ReactNode; // optional extra content rendered below the copy (e.g. a filter row)
}

// Shared hero header for every public page — same dark/accent-glow treatment
// as the home page's hero and CTA banner, so the site reads as one system
// rather than a plain h1 on every route.
export default function PageHero({ eyebrow, title, subtitle, stats, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden" style={{ background: "#1a1410" }}>
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(circle at 15% 20%, var(--accent), transparent 55%)" }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed">
            {subtitle}
          </p>
        )}
        {stats && stats.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
