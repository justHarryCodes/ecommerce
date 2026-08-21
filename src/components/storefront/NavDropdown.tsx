"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export interface NavDropdownItem {
  href: string;
  label: string;
  description?: string;
}

interface Props {
  label: string;
  icon?: ReactNode;
  items: NavDropdownItem[];
  footer?: NavDropdownItem;
  align?: "left" | "right";
}

// Reusable click-to-open dropdown for the 4 header groups (Collections,
// Company, Work, Account). Click rather than hover — works the same on
// touch and desktop, no accidental-hover flicker.
export default function NavDropdown({ label, icon, items, footer, align = "left" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 py-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {icon}
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-64 rounded-2xl border shadow-lg py-2 z-50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        >
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>Nothing here yet</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                {item.description && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                )}
              </Link>
            ))
          )}
          {footer && (
            <>
              <div className="my-1.5 border-t" style={{ borderColor: "var(--border)" }} />
              <Link
                href={footer.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: "var(--accent)" }}
              >
                {footer.label}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
