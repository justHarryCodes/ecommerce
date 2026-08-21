"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

// Inline contact-page form — same fields/endpoint as QuoteRequestModal, but
// rendered directly on the page rather than inside a modal.
export default function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in your name and phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          sourceType: "contact_form",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSubmitted(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-10 rounded-2xl border" style={{ borderColor: "var(--border)" }}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--accent-light)" }}>
          <Check className="h-7 w-7" style={{ color: "var(--accent-dark)" }} />
        </div>
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Thanks — we&apos;ll be in touch shortly
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Our team will reach out to you as soon as possible.
        </p>
        <Button className="mt-6" variant="secondary" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
      <Input label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+234 800 000 0000" />
      <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <Textarea label="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us a bit about what you need..." />
      <Button
        type="submit"
        variant="primary"
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white"
        loading={submitting}
      >
        Send Message
      </Button>
    </form>
  );
}
