"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, ChevronDown, MapPin, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { JobPosting, EmploymentType } from "@/types";

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export default function JobPostingCard({ job }: { job: JobPosting }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // /api/upload requires an authenticated session (dashboard-only route), so
  // public applicants can't upload a file there. Falling back to a plain
  // link/URL field (Google Drive, LinkedIn, etc.) keeps this working without
  // touching the shared upload route.
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const employmentType = job.employment_type ?? job.employmentType ?? "full_time";
  const isInternship = job.is_internship ?? job.isInternship;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPostingId: job.id,
          applicantName: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          resumeUrl: resumeUrl.trim() || undefined,
          coverNote: coverNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left"
      >
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{job.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            {job.department && (
              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.department}</span>
            )}
            {job.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
            )}
            <Badge variant="outline">{EMPLOYMENT_LABELS[employmentType]}</Badge>
            {isInternship && <Badge variant="info">Internship</Badge>}
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", expanded && "rotate-180")} style={{ color: "var(--text-muted)" }} />
      </button>

      {expanded && (
        <div className="border-t px-5 sm:px-6 py-6" style={{ borderColor: "var(--border)" }}>
          {job.description && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{job.description}</p>
          )}
          {job.requirements && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Requirements: </span>
              {job.requirements}
            </p>
          )}

          {submitted ? (
            <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "var(--accent-light)" }}>
              <Check className="h-5 w-5 shrink-0" style={{ color: "var(--accent-dark)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--accent-dark)" }}>
                Application submitted — thanks for your interest!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <Input label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
              <Input
                label="Link to your CV (optional)"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="Google Drive, LinkedIn, portfolio link, etc."
              />
              <Textarea label="Cover note (optional)" value={coverNote} onChange={(e) => setCoverNote(e.target.value)} placeholder="Tell us why you'd be a great fit..." />
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white"
                loading={submitting}
              >
                Submit Application
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
