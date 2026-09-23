"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import type { Project, ProjectCategory } from "@/types";
import { TagInput } from "@/components/dashboard/TagInput";
import { MultiImageUpload } from "@/components/dashboard/MultiImageUpload";

interface Props {
  project?: Project;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "hotels", label: "Hotels" },
  { value: "schools", label: "Schools" },
  { value: "offices", label: "Offices" },
  { value: "restaurants", label: "Restaurants" },
];

export default function ProjectForm({ project }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: project?.title ?? "",
    category: (project?.category ?? "residential") as ProjectCategory,
    location: project?.location ?? "",
    description: project?.description ?? "",
    servicesProvided: project?.services_provided ?? project?.servicesProvided ?? [],
    beforeImages: project?.before_images ?? project?.beforeImages ?? [],
    afterImages: project?.after_images ?? project?.afterImages ?? [],
    images: project?.images ?? [],
    isFeatured: project?.is_featured ?? project?.isFeatured ?? false,
    sortOrder: project?.sort_order ?? project?.sortOrder ?? 0,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error("Project title is required");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!project;
      const url = isEdit ? `/api/projects/${project.id}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          location: form.location.trim() || undefined,
          description: form.description.trim() || undefined,
          servicesProvided: form.servicesProvided,
          beforeImages: form.beforeImages,
          afterImages: form.afterImages,
          images: form.images,
          isFeatured: form.isFeatured,
          sortOrder: form.sortOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save");

      toast.success(isEdit ? "Project updated!" : "Project added!");
      router.push("/dashboard/projects");
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
        <label className={labelClass}>
          Project title <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Lekki Residential Villa — Full Interior Fit-out"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category</label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => set("category", e.target.value as ProjectCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Lekki, Lagos"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the project scope and outcome…"
        />
      </div>

      <TagInput
        label="Services provided"
        values={form.servicesProvided}
        onChange={(v) => set("servicesProvided", v)}
        placeholder="e.g. Woodworking — press Enter to add"
      />

      <MultiImageUpload label="Project images" values={form.images} onChange={(v) => set("images", v)} />
      <MultiImageUpload label="Before images" values={form.beforeImages} onChange={(v) => set("beforeImages", v)} />
      <MultiImageUpload label="After images" values={form.afterImages} onChange={(v) => set("afterImages", v)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="w-4 h-4 rounded accent-amber-400"
          />
          <span className="text-sm text-surface-700 dark:text-surface-300">Feature this project</span>
        </label>
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
          {loading ? "Saving…" : project ? "Update project" : "Add project"}
        </button>
      </div>
    </form>
  );
}
