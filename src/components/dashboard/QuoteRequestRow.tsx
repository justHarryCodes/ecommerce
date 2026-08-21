"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, Phone, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { QuoteRequest, QuoteRequestStatus } from "@/types";

interface Props {
  lead: QuoteRequest;
}

const STATUS_OPTIONS: { value: QuoteRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "border-blue-300 text-blue-700 dark:text-blue-400",
  contacted: "border-amber-300 text-amber-700 dark:text-amber-400",
  quoted: "border-purple-300 text-purple-700 dark:text-purple-400",
  won: "border-green-300 text-green-700 dark:text-green-400",
  lost: "border-red-300 text-red-600 dark:text-red-400",
};

const SOURCE_LABELS: Record<string, string> = {
  product: "Product",
  service: "Service",
  project: "Project",
  contact_form: "Contact form",
  general: "General",
};

export default function QuoteRequestRow({ lead }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(lead.status ?? "new");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleStatusChange(next: string) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/quote-requests/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      router.refresh();
    } catch {
      setStatus(prev);
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  const sourceType = lead.sourceType ?? lead.source_type;
  const sourceName = lead.sourceName ?? lead.source_name;
  const createdAt = lead.createdAt ?? lead.created_at;

  return (
    <div className="p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-900 dark:text-white">
              {lead.name}
            </span>
            {sourceType && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 font-medium">
                {SOURCE_LABELS[sourceType] ?? sourceType}
                {sourceName ? ` · ${sourceName}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {lead.phone}
            </span>
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {lead.email}
              </span>
            )}
            {createdAt && <span>{formatDate(createdAt)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={status}
            disabled={saving}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-surface-800 disabled:opacity-50 ${
              STATUS_STYLES[status] ?? STATUS_STYLES.new
            }`}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown
            className={`w-4 h-4 text-surface-300 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && lead.message && (
        <p className="mt-3 text-sm text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800/50 rounded-xl p-3 whitespace-pre-wrap">
          {lead.message}
        </p>
      )}
    </div>
  );
}
