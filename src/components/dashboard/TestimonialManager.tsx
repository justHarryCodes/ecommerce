"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Loader2, Quote, Star } from "lucide-react";
import type { Testimonial } from "@/types";
import { ImageUpload } from "@/components/ui/ImageUpload";
import DeleteEntityButton from "@/components/dashboard/DeleteEntityButton";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

const emptyForm = {
  customerName: "",
  customerTitle: "",
  quote: "",
  rating: 5,
  photoUrl: "",
  isFeatured: true,
};

export default function TestimonialManager({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleAdd() {
    if (!form.customerName.trim() || !form.quote.trim()) {
      toast.error("Customer name and quote are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerTitle: form.customerTitle.trim() || undefined,
          quote: form.quote.trim(),
          rating: form.rating,
          photoUrl: form.photoUrl || undefined,
          isFeatured: form.isFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add");
      toast.success("Testimonial added!");
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add testimonial");
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
        Add testimonial
      </button>

      {showForm && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5 space-y-4">
          <ImageUpload
            label="Customer photo (optional)"
            value={form.photoUrl}
            onChange={(url) => set("photoUrl", url)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Customer name</label>
              <input
                className={inputClass}
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="e.g. Adaeze O."
              />
            </div>
            <div>
              <label className={labelClass}>Title / role</label>
              <input
                className={inputClass}
                value={form.customerTitle}
                onChange={(e) => set("customerTitle", e.target.value)}
                placeholder="e.g. Homeowner, Lekki"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Quote</label>
            <textarea
              className={inputClass + " resize-none"}
              rows={3}
              value={form.quote}
              onChange={(e) => set("quote", e.target.value)}
              placeholder="What the customer said…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelClass}>Rating</label>
              <select
                className={inputClass}
                value={form.rating}
                onChange={(e) => set("rating", parseInt(e.target.value, 10))}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} star{r !== 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer pb-2.5">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">Featured</span>
            </label>
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
              {saving ? "Adding…" : "Add testimonial"}
            </button>
          </div>
        </div>
      )}

      {testimonials.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-12 text-center">
          <Quote className="w-10 h-10 text-surface-200 dark:text-surface-700 mx-auto mb-3" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-1">No testimonials yet</h3>
          <p className="text-sm text-surface-400">Add quotes from happy customers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-4 flex items-start gap-3"
            >
              {(t.photo_url ?? t.photoUrl) ? (
                <img
                  src={t.photo_url ?? t.photoUrl}
                  alt={t.customer_name ?? t.customerName ?? ""}
                  className="w-10 h-10 rounded-full object-cover border border-surface-100 dark:border-surface-700 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                  <Quote className="w-4 h-4 text-surface-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-surface-900 dark:text-white">
                    {t.customer_name ?? t.customerName}
                  </span>
                  {t.customer_title ?? t.customerTitle ? (
                    <span className="text-xs text-surface-400">
                      {t.customer_title ?? t.customerTitle}
                    </span>
                  ) : null}
                </div>
                {t.rating != null && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < (t.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-surface-200 dark:text-surface-700"
                        }`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-surface-600 dark:text-surface-300 mt-1.5">{t.quote}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {(t.is_featured ?? t.isFeatured) && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    Featured
                  </span>
                )}
                <DeleteEntityButton apiPath={`/api/testimonials/${t.id}`} label="Testimonial" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
