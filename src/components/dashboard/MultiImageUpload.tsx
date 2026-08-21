"use client";

import { X } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface Props {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
}

// A grid of already-uploaded images (each removable) plus one more
// ImageUpload slot to add another. Used for projects' before/after/images
// arrays where a single ImageUpload slot isn't enough.
export function MultiImageUpload({ label, values, onChange }: Props) {
  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{label}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {values.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative w-32 h-32 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <ImageUpload value="" onChange={(url) => url && onChange([...values, url])} />
      </div>
    </div>
  );
}
