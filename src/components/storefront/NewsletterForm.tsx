"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send, Check } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setDone(true);
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm" style={{ color: "var(--accent-light)" }}>
        <Check className="h-4 w-4" /> Thanks for subscribing!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="min-w-0 flex-1 rounded-lg px-3.5 py-2.5 text-sm bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
      />
      <button
        type="submit"
        disabled={submitting}
        aria-label="Subscribe"
        className="flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white shrink-0 disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
