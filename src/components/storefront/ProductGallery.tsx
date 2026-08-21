"use client";

import { useState } from "react";
import { clMedium, clThumb } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl flex items-center justify-center text-6xl" style={{ background: "var(--bg-tertiary)" }}>
        🛠️
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-2xl overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
        <img
          src={clMedium(images[active])}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors",
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
