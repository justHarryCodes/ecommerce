import { getHeroCollageImages } from "@/lib/hero-images";
import { clCard } from "@/lib/cloudinary";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

// Shared hero header for every public page — a photo-collage background
// (real work, not stock illustration) with a dark scrim for contrast and
// minimal, centered text on top. Same treatment everywhere so the site
// reads as one system.
export default async function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  const images = await getHeroCollageImages(6);
  const collage = images.length > 0
    ? Array.from({ length: 6 }, (_, i) => images[i % images.length])
    : [];

  return (
    <section className="relative overflow-hidden min-h-[260px] sm:min-h-[340px] flex items-center" style={{ background: "#1a1410" }}>
      {/* Collage background */}
      {collage.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-6 gap-0.5">
          {collage.map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <img src={clCard(img)} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Scrim for text contrast */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,15,10,0.72) 0%, rgba(20,15,10,0.8) 100%)" }} />

      {/* Minimal centered text */}
      <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
