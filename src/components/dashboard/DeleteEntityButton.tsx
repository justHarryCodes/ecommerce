"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props {
  apiPath: string; // e.g. `/api/services/${id}`
  label?: string; // toast copy, e.g. "Service"
}

// Generic delete-with-confirm icon button — same click-twice-to-confirm
// pattern as DeleteProductButton, parameterised by API path so it can be
// reused across services/projects/blog/careers.
export default function DeleteEntityButton({ apiPath, label = "Item" }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`${label} deleted`);
      router.refresh();
    } catch {
      toast.error(`Failed to delete ${label.toLowerCase()}`);
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      className={`p-1.5 rounded-lg transition-all ${
        confirm
          ? "bg-red-100 text-red-600 dark:bg-red-950/30"
          : "text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
      }`}
      title={confirm ? "Click again to confirm" : "Delete"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
