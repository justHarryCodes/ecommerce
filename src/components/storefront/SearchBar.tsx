"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { clThumb } from "@/lib/cloudinary";
import type { Product } from "@/types";

interface Props {
  className?: string;
  onNavigate?: () => void; // called when a result/submit navigates away (closes mobile panel)
  autoFocus?: boolean;
}

export default function SearchBar({ className = "", onNavigate, autoFocus }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Debounced live search
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      fetch(`/api/search/products?q=${encodeURIComponent(term)}`)
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((json) => setResults(json.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(handle);
  }, [q]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goToResults() {
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/products?search=${encodeURIComponent(term)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") goToResults();
    if (e.key === "Escape") setOpen(false);
  }

  const showDropdown = open && q.trim().length > 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className="flex items-center gap-2 rounded-full border px-4 py-2 transition-colors focus-within:ring-2"
        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products…"
          className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-current"
          style={{ color: "var(--text-primary)" }}
          aria-label="Search products"
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--text-muted)" }} />}
        {!loading && q && (
          <button onClick={() => { setQ(""); setResults([]); }} aria-label="Clear search" className="shrink-0">
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-lg overflow-hidden z-50"
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              {loading ? "Searching…" : `No products found for "${q.trim()}"`}
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1.5">
              {results.map((p) => {
                const image = p.images?.[0] ?? p.image_url;
                const price = p.price;
                const priceNote = p.price_note ?? p.priceNote;
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    onClick={() => { setOpen(false); onNavigate?.(); }}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {image ? (
                      <img src={clThumb(image)} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg" style={{ background: "var(--bg-secondary)" }}>
                        🛠️
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                        {price != null ? formatCurrency(price) : priceNote ?? "Request a quote"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <button
            onClick={goToResults}
            className="w-full text-center text-sm font-semibold py-3 border-t transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--accent)" }}
          >
            View all results for &ldquo;{q.trim()}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
