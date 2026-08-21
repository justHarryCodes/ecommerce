import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompany } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// NOTE: GET (dashboard applicants inbox) is owned by a parallel agent and
// will be added to this file separately. This file currently only
// implements the public POST handler used by the Careers page form.

const Schema = z.object({
  jobPostingId: z.string().uuid(),
  applicantName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  resumeUrl: z.string().max(2000).optional(),
  coverNote: z.string().max(4000).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, {
    key: "rl:job-applications",
    max: 5,
    window: 600,
    message: "Too many requests. Please wait a few minutes before trying again.",
  });
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    const { jobPostingId, applicantName, email, phone, resumeUrl, coverNote } = parsed.data;

    const company = await getCompany();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const posting = await queryOne(
      `SELECT id FROM job_postings WHERE id = $1 AND store_id = $2 AND is_active = true`,
      [jobPostingId, company.id]
    );
    if (!posting) {
      return NextResponse.json({ error: "This job posting is no longer available." }, { status: 404 });
    }

    await query(
      `INSERT INTO job_applications (job_posting_id, store_id, applicant_name, email, phone, resume_url, cover_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [jobPostingId, company.id, applicantName, email, phone || null, resumeUrl || null, coverNote || null]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[job-applications] POST error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
