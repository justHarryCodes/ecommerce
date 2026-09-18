import { NextRequest, NextResponse } from "next/server";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { query, withTransaction } from "@/lib/db";
import { syncDefaultAddress } from "@/lib/customer-addresses";
import { z } from "zod";

const AddressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  recipientName: z.string().trim().min(1, "Recipient name is required").max(200),
  phone: z.string().trim().min(5, "Phone is required").max(40),
  address: z.string().trim().min(3, "Address is required").max(500),
  city: z.string().trim().max(120).optional().default(""),
  state: z.string().trim().max(120).optional().default(""),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await getOrCreateCustomer(user);
  if (!customer) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const rows = await query(
    "SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC",
    [customer.id]
  );
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await getOrCreateCustomer(user);
  if (!customer) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const parsed = AddressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json({ error: Object.values(flat.fieldErrors)[0]?.[0] ?? "Invalid address" }, { status: 422 });
  }
  const d = parsed.data;

  const row = await withTransaction(async (client) => {
    const { rows: existing } = await client.query(
      "SELECT COUNT(*)::int AS n FROM customer_addresses WHERE customer_id = $1", [customer.id]
    );
    // First address is always the default
    const makeDefault = d.isDefault || existing[0].n === 0;
    if (makeDefault) {
      await client.query("UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1", [customer.id]);
    }
    const { rows } = await client.query(
      `INSERT INTO customer_addresses (customer_id, label, recipient_name, phone, address, city, state, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [customer.id, d.label, d.recipientName, d.phone, d.address, d.city || null, d.state || null, makeDefault]
    );
    return rows[0];
  });

  await syncDefaultAddress(customer.id);
  return NextResponse.json({ data: row }, { status: 201 });
}
