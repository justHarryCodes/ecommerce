"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clCard, clMedium } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { GalleryItem, GalleryFilterCategory } from "@/types";

const FILTERS: { value: GalleryFilterCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "metal", label: "Metal" },
  { value: "aluminum_glass", label: "Aluminum & Glass" },
  { value: "wood", label: "Wood" },
  { value: "decorative_concrete", label: "Decorative Concrete" },
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
];

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<GalleryFilterCategory | "all">("all");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = filter === "all" ? items : items.filter((i) => (i.filter_category ?? i.filterCategory) === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-colors border"
            style={
              filter === f.value
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm py-16 text-center" style={{ color: "var(--text-secondary)" }}>
          No items in this category yet.
        </p>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((item) => {
            const src = item.media_url ?? item.mediaUrl ?? "";
            const thumb = item.thumbnail_url ?? item.thumbnailUrl ?? src;
            return (
              <button
                key={item.id}
                onClick={() => setLightbox(src)}
                className={cn("block w-full rounded-xl overflow-hidden break-inside-avoid")}
                style={{ background: "var(--bg-tertiary)" }}
              >
                <img src={clCard(thumb)} alt={item.title ?? "Gallery image"} className="w-full h-auto object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-5 right-5 text-white/80 hover:text-white"
          >
            <X className="h-7 w-7" />
          </button>
          <img
            src={clMedium(lightbox)}
            alt="Gallery preview"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
