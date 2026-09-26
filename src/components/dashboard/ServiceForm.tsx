"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, X, ImageIcon } from "lucide-react";
import type { Service, Product } from "@/types";
import { TagInput } from "@/components/dashboard/TagInput";
import { uploadImage } from "@/lib/upload-image";

const MAX_IMAGES = 3;

interface Props {
  service?: Service;
  products: Pick<Product, "id" | "name">[];
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

export default function ServiceForm({ service, products }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(() => {
    if (service?.images?.length) return service.images;
    const legacy = service?.image_url ?? service?.imageUrl;
    return legacy ? [legacy] : [];
  });
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: service?.name ?? "",
    shortDescription: service?.short_description ?? service?.shortDescription ?? "",
    description: service?.description ?? "",
    icon: service?.icon ?? "",
    benefits: service?.benefits ?? [],
    relatedProductIds: service?.related_product_ids ?? service?.relatedProductIds ?? [],
    isActive: service?.is_active ?? service?.isActive ?? true,
    sortOrder: service?.sort_order ?? service?.sortOrder ?? 0,
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (images.length >= MAX_IMAGES) { toast.error(`Up to ${MAX_IMAGES} images allowed`); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Image must be under 20MB"); return; }

    const slot = images.length;
    setUploadingSlot(slot);
    try {
      const url = await uploadImage(file);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingSlot(null);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function toggleProduct(id: string) {
    set(
      "relatedProductIds",
      form.relatedProductIds.includes(id)
        ? form.relatedProductIds.filter((p) => p !== id)
        : [...form.relatedProductIds, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Service name is required");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!service;
      const url = isEdit ? `/api/services/${service.id}` : "/api/services";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          shortDescription: form.shortDescription.trim() || undefined,
          description: form.description.trim() || undefined,
          icon: form.icon.trim() || undefined,
          imageUrl: images[0],
          images,
          benefits: form.benefits,
          relatedProductIds: form.relatedProductIds,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save");

      toast.success(isEdit ? "Service updated!" : "Service added!");
      router.push("/dashboard/services");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6"
    >
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Service images
        </label>
        <div className="flex items-start gap-4 flex-wrap">
          {images.map((url, i) => (
            <div key={url} className="relative w-32 h-32 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 shrink-0">
              <img src={url} alt={`Service ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/60 text-white">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="relative w-32 h-32 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 cursor-pointer hover:border-accent-400 transition-colors overflow-hidden shrink-0">
              <div className="flex flex-col items-center justify-center h-full gap-2">
                {uploadingSlot !== null
                  ? <Loader2 className="w-5 h-5 text-surface-400 animate-spin" />
                  : <>
                      <ImageIcon className="w-5 h-5 text-surface-300" />
                      <span className="text-xs text-surface-400 text-center px-2">Click to upload</span>
                    </>
                }
              </div>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload} disabled={uploadingSlot !== null} />
            </label>
          )}
        </div>
        <p className="text-xs text-surface-400 mt-2">
          Up to {MAX_IMAGES} sample images of this work.
        </p>
      </div>

      <div>
        <label className={labelClass}>
          Service name <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Metal Fabrication"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Icon (emoji)</label>
          <input
            className={inputClass}
            value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            placeholder="🔩"
            maxLength={4}
          />
        </div>
        <div>
          <label className={labelClass}>Sort order</label>
          <input
            className={inputClass}
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Short description</label>
        <input
          className={inputClass}
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder="One line shown on service cards"
        />
      </div>

      <div>
        <label className={labelClass}>Full description</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={5}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe this service in detail…"
        />
      </div>

      <TagInput
        label="Benefits"
        values={form.benefits}
        onChange={(v) => set("benefits", v)}
        placeholder="e.g. Precision CNC cutting — press Enter to add"
      />

      {products.length > 0 && (
        <div>
          <label className={labelClass}>Related products (optional)</label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-700 p-3 space-y-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.relatedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="w-4 h-4 rounded accent-amber-400"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="w-4 h-4 rounded accent-amber-400"
        />
        <span className="text-sm text-surface-700 dark:text-surface-300">
          Show this service on storefront
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-white font-semibold py-3 rounded-xl text-sm transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-accent-400 hover:bg-accent-500 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving…" : service ? "Update service" : "Add service"}
        </button>
      </div>
    </form>
  );
}
