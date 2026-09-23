"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Loader2, ImageIcon, Video, Film } from "lucide-react";
import type { GalleryItem, GalleryFilterCategory } from "@/types";
import { ImageUpload } from "@/components/ui/ImageUpload";
import DeleteEntityButton from "@/components/dashboard/DeleteEntityButton";

const FILTER_CATEGORIES: { value: GalleryFilterCategory; label: string }[] = [
  { value: "metal", label: "Metal" },
  { value: "aluminum_glass", label: "Aluminum & Glass" },
  { value: "wood", label: "Wood" },
  { value: "decorative_concrete", label: "Decorative Concrete" },
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
];

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

const emptyForm = {
  title: "",
  mediaType: "image" as "image" | "video",
  mediaUrl: "",
  thumbnailUrl: "",
  filterCategory: "metal" as GalleryFilterCategory,
};

export default function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleAdd() {
    if (!form.mediaUrl.trim()) {
      toast.error(form.mediaType === "video" ? "Video URL is required" : "Upload an image");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim() || undefined,
          mediaType: form.mediaType,
          mediaUrl: form.mediaUrl.trim(),
          thumbnailUrl: form.thumbnailUrl.trim() || undefined,
          filterCategory: form.filterCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add");
      toast.success("Gallery item added!");
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm((s) => !s)}
        className="flex items-center gap-2 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add gallery item
      </button>

      {showForm && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5 space-y-4">
          <div className="flex gap-2">
            {(["image", "video"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("mediaType", t)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                  form.mediaType === t
                    ? "border-accent-400 bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300"
                    : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400"
                }`}
              >
                {t === "image" ? <ImageIcon className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                {t === "image" ? "Image" : "Video"}
              </button>
            ))}
          </div>

          {form.mediaType === "image" ? (
            <ImageUpload
              label="Image"
              value={form.mediaUrl}
              onChange={(url) => set("mediaUrl", url)}
            />
          ) : (
            <div>
              <label className={labelClass}>Video URL</label>
              <input
                className={inputClass}
                value={form.mediaUrl}
                onChange={(e) => set("mediaUrl", e.target.value)}
                placeholder="https://…"
              />
              <p className="text-xs text-surface-400 mt-1">
                Paste a direct video URL or embed link (e.g. YouTube).
              </p>
            </div>
          )}

          <div>
            <label className={labelClass}>Thumbnail URL (optional)</label>
            <input
              className={inputClass}
              value={form.thumbnailUrl}
              onChange={(e) => set("thumbnailUrl", e.target.value)}
              placeholder="Used for video previews"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title (optional)</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Short caption"
              />
            </div>
            <div>
              <label className={labelClass}>Filter category</label>
              <select
                className={inputClass}
                value={form.filterCategory}
                onChange={(e) => set("filterCategory", e.target.value as GalleryFilterCategory)}
              >
                {FILTER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyForm); }}
              className="flex-1 py-2.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-400 hover:bg-accent-500 disabled:opacity-50 text-black text-sm font-bold transition-all"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Adding…" : "Add item"}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-12 text-center">
          <Film className="w-10 h-10 text-surface-200 dark:text-surface-700 mx-auto mb-3" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-1">No gallery items yet</h3>
          <p className="text-sm text-surface-400">Add photos or videos of your work</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 aspect-square bg-surface-100 dark:bg-surface-800"
            >
              <img
                src={item.thumbnail_url ?? item.thumbnailUrl ?? item.media_url ?? item.mediaUrl}
                alt={item.title ?? ""}
                className="w-full h-full object-cover"
              />
              {(item.media_type ?? item.mediaType) === "video" && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full p-1">
                  <Video className="w-3 h-3" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                <span className="text-white text-xs font-medium truncate flex-1">
                  {item.title ?? (item.filter_category ?? item.filterCategory)}
                </span>
                <DeleteEntityButton apiPath={`/api/gallery/${item.id}`} label="Gallery item" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
