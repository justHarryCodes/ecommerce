"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { JobApplicationStatus } from "@/types";

interface Props {
  applicationId: string;
  status: JobApplicationStatus | string;
}

const STATUS_OPTIONS: { value: JobApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "border-blue-300 text-blue-700 dark:text-blue-400",
  reviewed: "border-surface-300 text-surface-700 dark:text-surface-300",
  shortlisted: "border-amber-300 text-amber-700 dark:text-amber-400",
  rejected: "border-red-300 text-red-600 dark:text-red-400",
  hired: "border-green-300 text-green-700 dark:text-green-400",
};

export default function ApplicationStatusSelect({ applicationId, status }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    const prev = current;
    setCurrent(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/job-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      router.refresh();
    } catch {
      setCurrent(prev);
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-surface-800 disabled:opacity-50 ${
        STATUS_STYLES[current] ?? STATUS_STYLES.new
      }`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
