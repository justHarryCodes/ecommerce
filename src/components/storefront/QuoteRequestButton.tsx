"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import QuoteRequestModal from "./QuoteRequestModal";
import type { QuoteRequestSourceType } from "@/types";

interface Props {
  sourceType: QuoteRequestSourceType;
  sourceId?: string;
  sourceName?: string;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

// Convenience wrapper around QuoteRequestModal — renders the trigger button
// and owns its own open/close state, so callers can just drop this in
// wherever a "Request a Quote" CTA is needed.
export default function QuoteRequestButton({
  sourceType,
  sourceId,
  sourceName,
  label = "Request a Quote",
  className,
  variant = "primary",
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={cn(variant === "primary" && "bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white", className)}
      >
        {label}
      </Button>
      <QuoteRequestModal
        isOpen={open}
        onClose={() => setOpen(false)}
        sourceType={sourceType}
        sourceId={sourceId}
        sourceName={sourceName}
      />
    </>
  );
}
