import { NextRequest, NextResponse } from "next/server";
import { verifySession, getOrCreateCustomer, getCompany } from "@/lib/auth";
import { query, toCamel } from "@/lib/db";
import { z } from "zod";

// Customer profile — GET auto-creates the customer row on first call
// (getOrCreateCustomer), PATCH updates saved name/phone/address/city/state.
// Any authenticated user can use this — admins included, though the
// dashboard doesn't surface it. Unauthenticated → 401.
export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await getOrCreateCustomer(user);
  if (!customer) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  return NextResponse.json({ data: customer });
}

const Schema = z.object({
  name: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompany();
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Ensure the row exists before updating (first save right after signup)
  await getOrCreateCustomer(user);

  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  for (const [key, val] of Object.entries(parsed.data)) {
    sets.push(`${key} = $${i++}`);
    vals.push(val);
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  sets.push(`updated_at = NOW()`);
  vals.push(company.id, user.firebaseUid);

  const rows = await query(
    `UPDATE customers SET ${sets.join(", ")} WHERE store_id = $${i++} AND firebase_uid = $${i} RETURNING *`,
    vals
  );

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) });
}
