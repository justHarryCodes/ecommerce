"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, X, Loader2, ImageIcon, ChevronDown, ChevronUp, Trash2, Check, AlertCircle,
} from "lucide-react";
import { uploadImage } from "@/lib/upload-image";
import type { Category } from "@/types";

const MAX_PRODUCTS = 20;
const MAX_IMAGES_PER_PRODUCT = 3;
const UPLOAD_CONCURRENCY = 3;

interface TrayImage {
  id: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  uploadedUrl?: string;
  error?: string;
}

interface DraftProduct {
  id: string;
  imageIds: string[];
  name: string;
  price: string;
  priceNote: string;
  categoryId: string;
  subcategoryId: string;
  stockQuantity: string;
  isPurchasable: boolean;
  showAdvanced: boolean;
  deliveryFeeWithinState: string;
  deliveryFeeInterstate: string;
  deliveryTimeline: string;
  isFeatured: boolean;
  isTopSelling: boolean;
  isSponsored: boolean;
  status: "pending" | "creating" | "done" | "error";
  resultError?: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newSlot(): DraftProduct {
  return {
    id: uid(),
    imageIds: [],
    name: "",
    price: "",
    priceNote: "",
    categoryId: "",
    subcategoryId: "",
    stockQuantity: "0",
    isPurchasable: false,
    showAdvanced: false,
    deliveryFeeWithinState: "0",
    deliveryFeeInterstate: "0",
    deliveryTimeline: "",
    isFeatured: false,
    isTopSelling: false,
    isSponsored: false,
    status: "pending",
  };
}

// Runs `worker` over `items` with at most `limit` in flight at once — keeps a
// 20-photo batch from firing 20 simultaneous uploads at the browser/Cloudinary.
async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  async function next(): Promise<void> {
    const i = cursor++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1";

export default function BulkProductForm({ categories }: { categories: (Category & { subcategories?: Category[] })[] }) {
  const router = useRouter();
  const [tray, setTray] = useState<TrayImage[]>([]);
  const [slots, setSlots] = useState<DraftProduct[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount so we don't leak memory across a long bulk session.
  useEffect(() => {
    return () => tray.forEach((t) => URL.revokeObjectURL(t.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topCats = categories.filter((c) => !c.parent_id);
  const subCatsFor = (categoryId: string) => categories.filter((c) => c.parent_id === categoryId);

  const assignedIds = new Set(slots.flatMap((s) => s.imageIds));
  const unassignedTray = tray.filter((t) => !assignedIds.has(t.id));
  const stillUploading = tray.some((t) => t.status === "uploading");
  const pendingSlots = slots.filter((s) => s.status !== "done");

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PRODUCTS * MAX_IMAGES_PER_PRODUCT - tray.length;
    if (room <= 0) {
      toast.error(`This batch is full (max ${MAX_PRODUCTS} products / ${MAX_PRODUCTS * MAX_IMAGES_PER_PRODUCT} photos).`);
      return;
    }
    const accepted = files.slice(0, room);
    if (accepted.length < files.length) {
      toast.error(`Only added the first ${accepted.length} photos — that's the max for one batch.`);
    }

    const newItems: TrayImage[] = accepted.map((file) => ({
      id: uid(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    setTray((prev) => [...prev, ...newItems]);

    runWithConcurrency(newItems, UPLOAD_CONCURRENCY, async (item) => {
      try {
        const url = await uploadImage(item.file);
        setTray((prev) => prev.map((t) => (t.id === item.id ? { ...t, status: "done", uploadedUrl: url } : t)));
      } catch (err) {
        setTray((prev) =>
          prev.map((t) =>
            t.id === item.id
              ? { ...t, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : t
          )
        );
      }
    });
  }

  function createSlot() {
    if (slots.length >= MAX_PRODUCTS) {
      toast.error(`Up to ${MAX_PRODUCTS} products per batch — create this batch first, then start another.`);
      return;
    }
    const slot = newSlot();
    setSlots((prev) => [...prev, slot]);
    setActiveSlotId(slot.id);
  }

  function assignToActive(trayId: string) {
    const item = tray.find((t) => t.id === trayId);
    if (!item || item.status === "error") return;

    let targetId = activeSlotId;
    if (!targetId || !slots.some((s) => s.id === targetId && s.status !== "done")) {
      const slot = newSlot();
      setSlots((prev) => [...prev, slot]);
      targetId = slot.id;
      setActiveSlotId(targetId);
    }

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== targetId) return s;
        if (s.imageIds.length >= MAX_IMAGES_PER_PRODUCT) {
          toast.error(`Up to ${MAX_IMAGES_PER_PRODUCT} images per product — click "New product" to start another.`);
          return s;
        }
        return { ...s, imageIds: [...s.imageIds, trayId] };
      })
    );
  }

  function unassignImage(slotId: string, trayId: string) {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, imageIds: s.imageIds.filter((id) => id !== trayId) } : s)));
  }

  function removeTrayImage(trayId: string) {
    setSlots((prev) => prev.map((s) => ({ ...s, imageIds: s.imageIds.filter((id) => id !== trayId) })));
    setTray((prev) => {
      const item = prev.find((t) => t.id === trayId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((t) => t.id !== trayId);
    });
  }

  function removeSlot(slotId: string) {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    if (activeSlotId === slotId) setActiveSlotId(null);
  }

  function patchSlot(slotId: string, patch: Partial<DraftProduct>) {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...patch } : s)));
  }

  async function handleSubmit() {
    if (pendingSlots.length === 0) {
      toast.error("Add at least one product first.");
      return;
    }
    const missingName = pendingSlots.find((s) => !s.name.trim());
    if (missingName) {
      toast.error("Every product needs a name.");
      return;
    }
    if (stillUploading) {
      toast.error("Wait for all photos to finish uploading first.");
      return;
    }
    const brokenSlot = pendingSlots.find((s) => s.imageIds.some((id) => tray.find((t) => t.id === id)?.status === "error"));
    if (brokenSlot) {
      toast.error("One product has a failed photo upload — remove it or retry before creating.");
      return;
    }

    setSubmitting(true);
    setSlots((prev) => prev.map((s) => (s.status !== "done" ? { ...s, status: "creating" } : s)));

    try {
      const payload = pendingSlots.map((s) => {
        const images = s.imageIds
          .map((id) => tray.find((t) => t.id === id)?.uploadedUrl)
          .filter((u): u is string => !!u);
        return {
          name: s.name.trim(),
          price: s.price ? Number(s.price) : undefined,
          priceNote: s.priceNote || undefined,
          categoryId: s.categoryId || undefined,
          subcategoryId: s.subcategoryId || undefined,
          stockQuantity: Number(s.stockQuantity) || 0,
          isPurchasable: s.isPurchasable,
          images,
          imageUrl: images[0],
          deliveryFeeWithinState: Number(s.deliveryFeeWithinState) || 0,
          deliveryFeeInterstate: Number(s.deliveryFeeInterstate) || 0,
          deliveryTimeline: s.deliveryTimeline || undefined,
          isFeatured: s.isFeatured,
          isTopSelling: s.isTopSelling,
          isSponsored: s.isSponsored,
        };
      });

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Server error (HTTP ${res.status}). Please try again.`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Bulk create failed");

      const results: { index: number; success: boolean; error?: string }[] = json.results;
      let successCount = 0;
      setSlots((prev) => {
        const next = [...prev];
        pendingSlots.forEach((slot, i) => {
          const result = results[i];
          const idx = next.findIndex((s) => s.id === slot.id);
          if (idx === -1) return;
          if (result?.success) {
            successCount++;
            next[idx] = { ...next[idx], status: "done", resultError: undefined };
          } else {
            next[idx] = { ...next[idx], status: "error", resultError: result?.error ?? "Failed to create" };
          }
        });
        return next;
      });

      if (successCount === pendingSlots.length) {
        toast.success(`${successCount} product${successCount !== 1 ? "s" : ""} created!`);
        router.refresh();
      } else if (successCount > 0) {
        toast.success(`${successCount} of ${pendingSlots.length} created — fix the rest and try again.`);
        router.refresh();
      } else {
        toast.error("None of these could be created — check the errors below.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk create failed");
      setSlots((prev) => prev.map((s) => (s.status === "creating" ? { ...s, status: "error", resultError: "Request failed" } : s)));
    } finally {
      setSubmitting(false);
    }
  }

  const allDone = slots.length > 0 && slots.every((s) => s.status === "done");

  return (
    <div className="space-y-6">
      {/* Step 1 — select photos */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-surface-900 dark:text-white">1. Select photos</h2>
          <span className="text-xs text-surface-400">{tray.length} photo{tray.length !== 1 ? "s" : ""} selected</span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 hover:border-accent-400 transition-colors text-sm font-semibold text-surface-600 dark:text-surface-300"
        >
          <ImageIcon className="w-4 h-4" />
          Choose photos…
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelected} />

        {unassignedTray.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-surface-400 mb-2">
              Click a photo to add it to the highlighted product below (or start a new one).
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedTray.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => (t.status === "done" ? assignToActive(t.id) : undefined)}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 shrink-0 group"
                  title={t.status === "error" ? t.error : "Add to product"}
                >
                  <img src={t.previewUrl} alt="" className="w-full h-full object-cover" />
                  {t.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                  {t.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); removeTrayImage(t.id); }}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — group into products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-surface-900 dark:text-white">2. Group into products & fill in details</h2>
          <button
            type="button"
            onClick={createSlot}
            disabled={slots.length >= MAX_PRODUCTS}
            className="flex items-center gap-1.5 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> New product
          </button>
        </div>

        {slots.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-10 text-center">
            <p className="text-sm text-surface-400">
              Select some photos above, then click one (or click &ldquo;New product&rdquo;) to start grouping.
            </p>
          </div>
        ) : (
          slots.map((slot, slotIndex) => {
            const isActive = activeSlotId === slot.id && slot.status !== "done";
            const editable = slot.status === "pending" || slot.status === "error";
            return (
              <div
                key={slot.id}
                className={`bg-white dark:bg-surface-900 rounded-2xl border p-5 transition-colors ${
                  isActive ? "border-accent-400 ring-2 ring-accent-400/30" : "border-surface-100 dark:border-surface-800"
                }`}
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {slot.imageIds.map((id) => {
                      const img = tray.find((t) => t.id === id);
                      if (!img) return null;
                      return (
                        <div key={id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 shrink-0">
                          <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                          {editable && (
                            <button
                              type="button"
                              onClick={() => unassignImage(slot.id, id)}
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {editable && slot.imageIds.length < MAX_IMAGES_PER_PRODUCT && (
                      <button
                        type="button"
                        onClick={() => setActiveSlotId(slot.id)}
                        className={`w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? "border-accent-400 text-accent-500" : "border-surface-200 dark:border-surface-700 text-surface-300 hover:border-accent-400"
                        }`}
                        title="Set as active — click tray photos above to add them here"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {slot.status === "done" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4" /> Created
                      </span>
                    )}
                    {slot.status === "creating" && <Loader2 className="w-4 h-4 animate-spin text-surface-400" />}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {slot.status === "error" && slot.resultError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
                    <AlertCircle className="w-3.5 h-3.5" /> {slot.resultError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Product name *</label>
                    <input
                      value={slot.name}
                      disabled={!editable}
                      onChange={(e) => patchSlot(slot.id, { name: e.target.value })}
                      onFocus={() => setActiveSlotId(slot.id)}
                      placeholder={`Product ${slotIndex + 1}`}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Price (₦)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={slot.price}
                      disabled={!editable}
                      onChange={(e) => patchSlot(slot.id, { price: e.target.value })}
                      placeholder="Leave blank to hide"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Price note</label>
                    <input
                      value={slot.priceNote}
                      disabled={!editable}
                      onChange={(e) => patchSlot(slot.id, { priceNote: e.target.value })}
                      placeholder="e.g. From ₦50,000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <select
                      value={slot.categoryId}
                      disabled={!editable}
                      onChange={(e) => patchSlot(slot.id, { categoryId: e.target.value, subcategoryId: "" })}
                      className={inputClass}
                    >
                      <option value="">Uncategorized</option>
                      {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Stock quantity</label>
                    <input
                      type="number" min="0"
                      value={slot.stockQuantity}
                      disabled={!editable}
                      onChange={(e) => patchSlot(slot.id, { stockQuantity: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.isPurchasable}
                    disabled={!editable}
                    onChange={(e) => patchSlot(slot.id, { isPurchasable: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-400"
                  />
                  <span className="text-xs font-medium text-surface-700 dark:text-surface-300">
                    Sellable at a fixed price (Add to Cart) — requires a price above
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => patchSlot(slot.id, { showAdvanced: !slot.showAdvanced })}
                  className="flex items-center gap-1 mt-3 text-xs font-semibold text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  {slot.showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Advanced (delivery, homepage placement)
                </button>

                {slot.showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Subcategory</label>
                      <select
                        value={slot.subcategoryId}
                        disabled={!editable || !slot.categoryId}
                        onChange={(e) => patchSlot(slot.id, { subcategoryId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">None</option>
                        {subCatsFor(slot.categoryId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Delivery timeline</label>
                      <input
                        value={slot.deliveryTimeline}
                        disabled={!editable}
                        onChange={(e) => patchSlot(slot.id, { deliveryTimeline: e.target.value })}
                        placeholder="e.g. 3-5 business days"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Delivery — within state (₦)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={slot.deliveryFeeWithinState}
                        disabled={!editable}
                        onChange={(e) => patchSlot(slot.id, { deliveryFeeWithinState: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Delivery — outside state (₦)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={slot.deliveryFeeInterstate}
                        disabled={!editable}
                        onChange={(e) => patchSlot(slot.id, { deliveryFeeInterstate: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={slot.isFeatured} disabled={!editable}
                          onChange={(e) => patchSlot(slot.id, { isFeatured: e.target.checked })}
                          className="w-4 h-4 rounded accent-amber-400" />
                        <span className="text-xs text-surface-700 dark:text-surface-300">Featured</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={slot.isTopSelling} disabled={!editable}
                          onChange={(e) => patchSlot(slot.id, { isTopSelling: e.target.checked })}
                          className="w-4 h-4 rounded accent-amber-400" />
                        <span className="text-xs text-surface-700 dark:text-surface-300">Top Selling</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={slot.isSponsored} disabled={!editable}
                          onChange={(e) => patchSlot(slot.id, { isSponsored: e.target.checked })}
                          className="w-4 h-4 rounded accent-amber-400" />
                        <span className="text-xs text-surface-700 dark:text-surface-300">Sponsored</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Submit */}
      {slots.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-4 shadow-lg">
          <p className="text-xs text-surface-400">
            {allDone
              ? "All products created."
              : `${pendingSlots.length} product${pendingSlots.length !== 1 ? "s" : ""} ready to create.`}
          </p>
          {allDone ? (
            <button
              type="button"
              onClick={() => router.push("/dashboard/products")}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-accent-400 hover:bg-accent-500 transition-all"
            >
              Go to products
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || stillUploading || pendingSlots.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-accent-400 hover:bg-accent-500 disabled:opacity-60 transition-all"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating…" : `Create ${pendingSlots.length} product${pendingSlots.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
