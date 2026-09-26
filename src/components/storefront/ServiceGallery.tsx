"use client";

import { useState } from "react";
import { clBanner, clThumb } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  name: string;
}

// Same wide-banner treatment the service detail page always had, extended
// to support up to 3 sample images — a thumbnail row appears only when
// there's more than one photo to switch between.
export default function ServiceGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="rounded-2xl overflow-hidden aspect-[21/9]" style={{ background: "var(--bg-tertiary)" }}>
        <img src={clBanner(images[active])} alt={name} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-24 rounded-lg overflow-hidden border-2 transition-colors shrink-0",
                i === active ? "" : "border-transparent opacity-70 hover:opacity-100"
              )}
              style={i === active ? { borderColor: "var(--accent)" } : undefined}
              aria-label={`View image ${i + 1}`}
            >
              <img src={clThumb(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
