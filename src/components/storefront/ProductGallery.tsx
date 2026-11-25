"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cl, clThumb } from "@/lib/cloudinary";

interface Props {
  images: string[];
  name: string;
  badge?: string | null;
}

const mainImg = (url: string) => cl(url, "f_auto,q_auto:good,c_fill,w_1000,h_1000");

export default function ProductGallery({ images, name, badge }: Props) {
  const [active, setActive] = useState(0);
  const count = images.length;
  const go = (i: number) => setActive(((i % count) + count) % count);

  if (count === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl text-6xl" style={{ background: "var(--well)" }} aria-hidden="true">
        🛠️
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square overflow-hidden rounded-3xl" style={{ background: "var(--well)" }}>
        <img
          src={mainImg(images[active])}
          alt={count > 1 ? `${name} — image ${active + 1} of ${count}` : name}
          className="h-full w-full object-cover"
          {...(active === 0 ? ({ fetchPriority: "high" } as Record<string, string>) : {})}
        />

        {badge && (
          <span
            className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold text-white shadow-md"
            style={{ background: "var(--accent-dark)" }}
          >
            {badge}
          </span>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur" aria-hidden="true">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-[opacity,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              style={{
                borderColor: i === active ? "var(--accent)" : "transparent",
                background: "var(--well)",
                opacity: i === active ? 1 : 0.7,
              }}
            >
              <img src={clThumb(img)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
