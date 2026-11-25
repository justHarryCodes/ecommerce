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
    <form onSubmit={handleSubmit} className="flex gap-2 rounded-full border border-white/15 bg-white/5 p-1 focus-within:border-white/40">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        disabled={submitting}
        aria-label="Subscribe"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ background: "var(--accent)" }}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
