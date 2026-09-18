import { NextRequest, NextResponse } from "next/server";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { queryOne, query, withTransaction } from "@/lib/db";
import { syncDefaultAddress } from "@/lib/customer-addresses";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  label: z.string().trim().min(1).max(40).optional(),
  recipientName: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().min(5).max(40).optional(),
  address: z.string().trim().min(3).max(500).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  isDefault: z.literal(true).optional(),
});

const COLUMNS: Record<string, string> = {
  label: "label", recipientName: "recipient_name", phone: "phone",
  address: "address", city: "city", state: "state",
};

// Resolves the address only if it belongs to the logged-in customer.
async function owner(id: string) {
  const user = await verifySession();
  if (!user) return null;
  const customer = await getOrCreateCustomer(user);
  if (!customer) return null;
  const addr = await queryOne<{ id: string; is_default: boolean }>(
    "SELECT id, is_default FROM customer_addresses WHERE id = $1 AND customer_id = $2", [id, customer.id]
  );
  return addr ? { customer, addr } : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await owner(id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid address" }, { status: 422 });

  await withTransaction(async (client) => {
    if (parsed.data.isDefault) {
      await client.query("UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1", [ctx.customer.id]);
      await client.query("UPDATE customer_addresses SET is_default = TRUE WHERE id = $1", [id]);
    }
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(parsed.data)) {
      if (COLUMNS[k]) { sets.push(`${COLUMNS[k]} = $${vals.length + 1}`); vals.push(v); }
    }
    if (sets.length) {
      vals.push(id);
      await client.query(
        `UPDATE customer_addresses SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${vals.length}`, vals
      );
    }
  });

  await syncDefaultAddress(ctx.customer.id);
  const row = await queryOne("SELECT * FROM customer_addresses WHERE id = $1", [id]);
  return NextResponse.json({ data: row });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await owner(id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query("DELETE FROM customer_addresses WHERE id = $1", [id]);
  // If the default was removed, promote the newest remaining address
  if (ctx.addr.is_default) {
    await query(
      `UPDATE customer_addresses SET is_default = TRUE WHERE id = (
         SELECT id FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1)`,
      [ctx.customer.id]
    );
  }
  await syncDefaultAddress(ctx.customer.id);
  return NextResponse.json({ ok: true });
}
