import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// NOTE: GET (dashboard leads inbox) is owned by a parallel agent and will be
// added to this file separately. This file currently only implements the
// public POST handler used by QuoteRequestModal / the Contact page form.

const Schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(1).max(40),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().max(2000).optional(),
  sourceType: z.enum(["product", "service", "project", "contact_form", "general"]),
  sourceId: z.string().uuid().optional(),
  sourceName: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  // 5 quote requests per 10 minutes per IP — generous enough for a genuine
  // buyer filling the form more than once, but blocks basic spam scripts.
  const limited = await checkRateLimit(req, {
    key: "rl:quote-requests",
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
    const { name, phone, email, message, sourceType, sourceId, sourceName } = parsed.data;

    const company = await getCompany();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    await query(
      `INSERT INTO quote_requests (store_id, name, email, phone, message, source_type, source_id, source_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        company.id,
        name,
        email || null,
        phone,
        message || null,
        sourceType,
        sourceId || null,
        sourceName || null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[quote-requests] POST error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
