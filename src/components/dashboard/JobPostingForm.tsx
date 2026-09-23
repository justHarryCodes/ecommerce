"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import type { JobPosting, EmploymentType } from "@/types";

interface Props {
  job?: JobPosting;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export default function JobPostingForm({ job }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: job?.title ?? "",
    department: job?.department ?? "",
    location: job?.location ?? "",
    employmentType: (job?.employment_type ?? job?.employmentType ?? "full_time") as EmploymentType,
    description: job?.description ?? "",
    requirements: job?.requirements ?? "",
    isInternship: job?.is_internship ?? job?.isInternship ?? false,
    isActive: job?.is_active ?? job?.isActive ?? true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error("Job title is required");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!job;
      const url = isEdit ? `/api/job-postings/${job.id}` : "/api/job-postings";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          department: form.department.trim() || undefined,
          location: form.location.trim() || undefined,
          employmentType: form.employmentType,
          description: form.description.trim() || undefined,
          requirements: form.requirements.trim() || undefined,
          isInternship: form.isInternship,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save");

      toast.success(isEdit ? "Job posting updated!" : "Job posting added!");
      router.push("/dashboard/careers");
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
          Job title <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Metal Fabrication Technician"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Department</label>
          <input
            className={inputClass}
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
            placeholder="e.g. Production"
          />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Lagos"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Employment type</label>
        <select
          className={inputClass}
          value={form.employmentType}
          onChange={(e) => {
            const val = e.target.value as EmploymentType;
            set("employmentType", val);
            set("isInternship", val === "internship");
          }}
        >
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={5}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Role description…"
        />
      </div>

      <div>
        <label className={labelClass}>Requirements</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={4}
          value={form.requirements}
          onChange={(e) => set("requirements", e.target.value)}
          placeholder="What candidates need…"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="w-4 h-4 rounded accent-amber-400"
        />
        <span className="text-sm text-surface-700 dark:text-surface-300">
          Open (visible to applicants)
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
          {loading ? "Saving…" : job ? "Update job posting" : "Add job posting"}
        </button>
      </div>
    </form>
  );
}
