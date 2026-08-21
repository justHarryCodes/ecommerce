import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, {
    key: "rl:newsletter",
    max: 5,
    window: 600,
    message: "Too many requests. Please wait a few minutes before trying again.",
  });
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
    }

    const company = await getCompany();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    await query(
      `INSERT INTO newsletter_subscribers (store_id, email) VALUES ($1, $2)
       ON CONFLICT (store_id, email) DO NOTHING`,
      [company.id, parsed.data.email]
    );

    // Always report success — even on conflict — so it feels seamless to
    // someone who already subscribed.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[newsletter] POST error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
