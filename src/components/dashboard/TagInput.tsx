"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
}

// Simple add/remove chip input for TEXT[] columns (benefits, services_provided,
// size/material/color options, …). Type a value and press Enter or "," to add it.
export function TagInput({ label, values, onChange, placeholder, hint }: Props) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  function remove(v: string) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300 text-xs font-medium"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="hover:bg-accent-100 dark:hover:bg-accent-900/40 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => {
          if (e.target.value.endsWith(",")) {
            setDraft(e.target.value.slice(0, -1));
            commit();
            return;
          }
          setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Backspace" && !draft && values.length) {
            remove(values[values.length - 1]);
          }
        }}
        onBlur={commit}
        placeholder={placeholder ?? "Type and press Enter to add…"}
        className="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
      />
      {hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
    </div>
  );
}
