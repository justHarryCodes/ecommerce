import { getHeroCollageImages } from "@/lib/hero-images";
import { clCard } from "@/lib/cloudinary";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

// Shared hero for inner public pages — a rounded dark card (matching the
// homepage banners) with a faint photo collage of real work behind a warm
// ink scrim, copper glow, and left-aligned text.
export default async function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  const images = await getHeroCollageImages(6);
  const collage = images.length > 0
    ? Array.from({ length: 6 }, (_, i) => images[i % images.length])
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <section
        className="relative flex min-h-[220px] sm:min-h-[280px] items-end overflow-hidden rounded-[28px]"
        style={{ background: "var(--ink)" }}
      >
        {collage.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-6 gap-0.5 opacity-60" aria-hidden="true">
            {collage.map((img, i) => (
              <div key={i} className="relative overflow-hidden">
                <img src={clCard(img)} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(70% 120% at 100% 0%, rgba(181,98,42,0.35) 0%, transparent 60%), linear-gradient(90deg, rgba(23,18,14,0.94) 0%, rgba(23,18,14,0.78) 55%, rgba(23,18,14,0.55) 100%)",
          }}
        />

        <div className="relative w-full px-6 py-10 sm:px-12 sm:py-14">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent-light)" }}>
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 max-w-2xl text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
