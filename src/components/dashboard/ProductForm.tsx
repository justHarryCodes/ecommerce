"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, X, ImageIcon } from "lucide-react";
import type { Category, Product } from "@/types";
import { TagInput } from "@/components/dashboard/TagInput";
import { compressImage } from "@/lib/image-compress";

const MAX_IMAGES = 3;

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  // Price is optional — the catalog can show a fixed price, a "from ₦X"
  // note (priceNote), or neither ("Request a quote"). Kept as a plain
  // string here (empty string allowed) and converted to a number — or
  // omitted entirely — in onSubmit, to avoid z.coerce turning "" into 0.
  price: z.string().optional(),
  priceNote: z.string().max(100).optional(),
  comparePrice: z.coerce.number().optional(),
  deliveryFeeWithinState: z.coerce.number().min(0, "Delivery fee cannot be negative").optional(),
  deliveryFeeInterstate: z.coerce.number().min(0, "Delivery fee cannot be negative").optional(),
  deliveryTimeline: z.string().max(120).optional(),
  stockQuantity: z.coerce.number().min(0, "Stock cannot be negative").int(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
  isPurchasable: z.boolean().default(false).optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  storeId?: string; // optional — API resolves from session
  categories: (Category & { subcategories?: Category[] })[];
  product?: Product;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(
    product?.images?.length ? product.images : product?.image_url ? [product.image_url] : []
  );
  // Index of the slot currently uploading, so only that tile shows a spinner
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [selectedCatId, setSelectedCatId] = useState(product?.category_id ?? "");
  const [sizeOptions, setSizeOptions] = useState<string[]>(product?.size_options ?? []);
  const [materialOptions, setMaterialOptions] = useState<string[]>(product?.material_options ?? []);
  const [colorOptions, setColorOptions] = useState<string[]>(product?.color_options ?? []);

  // Build category tree: top-level cats with their subcategories
  const topCats = categories.filter((c) => !c.parent_id);
  const subCats = selectedCatId
    ? categories.filter((c) => c.parent_id === selectedCatId)
    : [];

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price != null ? String(product.price) : "",
      priceNote: product?.price_note ?? "",
      comparePrice: product?.compare_price ?? undefined,
      deliveryFeeWithinState: product?.delivery_fee_within_state ?? 0,
      deliveryFeeInterstate: product?.delivery_fee_interstate ?? 0,
      deliveryTimeline: product?.delivery_timeline ?? "",
      stockQuantity: product?.stock_quantity ?? 0,
      categoryId: product?.category_id ?? "",
      subcategoryId: product?.subcategory_id ?? "",
      isActive: product?.is_active ?? true,
      isPurchasable: product?.is_purchasable ?? false,
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (images.length >= MAX_IMAGES) { toast.error(`Up to ${MAX_IMAGES} images allowed`); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }

    const slot = images.length;
    setUploadingSlot(slot);
    try {
      // Shrink oversized photos in the browser first — keeps uploads fast
      // and light on our server and Cloudinary bandwidth alike.
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages((prev) => [...prev, data.url]);
    } catch { toast.error("Image upload failed"); }
    finally { setUploadingSlot(null); }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(data: FormData) {
    if (data.isPurchasable && !data.price) {
      toast.error("Set a price before marking this product as Add to Cart");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!product;
      const url = isEdit ? `/api/products/${product.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: data.price ? Number(data.price) : undefined,
          imageUrl: images[0],
          images,
          categoryId: data.categoryId || undefined,
          subcategoryId: data.subcategoryId || undefined,
          sizeOptions,
          materialOptions,
          colorOptions,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(
        typeof json.error === "string" ? json.error : "Failed to save product"
      );

      toast.success(isEdit ? "Product updated!" : "Product added!");
      router.push("/dashboard/products");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6"
    >
      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Product images
        </label>
        <div className="flex items-start gap-4 flex-wrap">
          {images.map((url, i) => (
            <div key={url} className="relative w-32 h-32 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 shrink-0">
              <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
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
          Up to {MAX_IMAGES} images. The first is used as the main/catalog photo. Large photos are
          automatically resized before upload to keep things fast.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          Product name <span className="text-red-500">*</span>
        </label>
        <input {...register("name")} className={inputClass} placeholder="e.g. Premium Sneakers" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          Description
        </label>
        <textarea {...register("description")} rows={4}
          className={inputClass + " resize-none"} placeholder="Describe your product…" />
      </div>

      {/* Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Price (₦)
          </label>
          <input {...register("price")} type="number" step="0.01" min="0"
            className={inputClass} placeholder="Leave blank to hide price" />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Compare price (₦)
          </label>
          <input {...register("comparePrice")} type="number" step="0.01" min="0"
            className={inputClass} placeholder="Strike-through price" />
        </div>
      </div>

      {/* Price note */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          Price note
        </label>
        <input {...register("priceNote")} className={inputClass}
          placeholder="e.g. From ₦450,000 or Contact for quote" />
        <p className="text-xs text-surface-400 mt-1">
          Shown instead of (or alongside) the price on the catalog — useful when pricing depends on size/materials.
        </p>
      </div>

      {/* Delivery */}
      <div>
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Delivery</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
              Within state (₦)
            </label>
            <input {...register("deliveryFeeWithinState")} type="number" step="0.01" min="0"
              className={inputClass} placeholder="0.00" />
            {errors.deliveryFeeWithinState && <p className="text-red-500 text-xs mt-1">{errors.deliveryFeeWithinState.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
              Outside state / interstate (₦)
            </label>
            <input {...register("deliveryFeeInterstate")} type="number" step="0.01" min="0"
              className={inputClass} placeholder="0.00" />
            {errors.deliveryFeeInterstate && <p className="text-red-500 text-xs mt-1">{errors.deliveryFeeInterstate.message}</p>}
          </div>
        </div>
        <p className="text-xs text-surface-400 mt-1.5">
          Leave both at 0 if delivery is free or quoted separately.
        </p>
        <div className="mt-3">
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
            Delivery timeline
          </label>
          <input {...register("deliveryTimeline")} className={inputClass}
            placeholder="e.g. 3-5 business days, or 2 weeks — made to order" />
          {errors.deliveryTimeline && <p className="text-red-500 text-xs mt-1">{errors.deliveryTimeline.message}</p>}
        </div>
      </div>

      {/* Catalog options */}
      <div className="grid sm:grid-cols-3 gap-4">
        <TagInput
          label="Size options"
          values={sizeOptions}
          onChange={setSizeOptions}
          placeholder="e.g. 3m Wide"
        />
        <TagInput
          label="Material options"
          values={materialOptions}
          onChange={setMaterialOptions}
          placeholder="e.g. Mild Steel"
        />
        <TagInput
          label="Color options"
          values={colorOptions}
          onChange={setColorOptions}
          placeholder="e.g. Charcoal Grey"
        />
      </div>

      {/* Stock */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          Stock quantity <span className="text-red-500">*</span>
        </label>
        <input {...register("stockQuantity")} type="number" min="0"
          className={inputClass} placeholder="0" />
        {errors.stockQuantity && (
          <p className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Category
          </label>
          <select {...register("categoryId")} className={inputClass}
            onChange={(e) => {
              register("categoryId").onChange(e);
              setSelectedCatId(e.target.value);
              setValue("subcategoryId", "");
            }}>
            <option value="">Select category</option>
            {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Subcategory
          </label>
          <select {...register("subcategoryId")} className={inputClass}
            disabled={!selectedCatId || subCats.length === 0}>
            <option value="">Select subcategory</option>
            {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Purchase mode */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-1">
        <label className="flex items-center gap-3 cursor-pointer">
          <input {...register("isPurchasable")} type="checkbox" id="isPurchasable"
            className="w-4 h-4 rounded accent-amber-400" />
          <span className="text-sm font-medium text-surface-900 dark:text-white">
            Sellable at a fixed price (Add to Cart)
          </span>
        </label>
        <p className="text-xs text-surface-400 pl-7">
          On: shows an &ldquo;Add to Cart&rdquo; button and goes through checkout — requires a price above.
          Off (default): shows &ldquo;Request a Quote&rdquo; only, for custom/made-to-order work.
        </p>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input {...register("isActive")} type="checkbox" id="isActive"
          className="w-4 h-4 rounded accent-amber-400" />
        <span className="text-sm text-surface-700 dark:text-surface-300">
          Show this product on storefront
        </span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-white font-semibold py-3 rounded-xl text-sm transition-all">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-accent-400 hover:bg-accent-500 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-all">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving…" : product ? "Update product" : "Add product"}
        </button>
      </div>
    </form>
  );
}
