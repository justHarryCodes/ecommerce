import { NextRequest, NextResponse } from "next/server";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { queryOne, query } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ orderId: string }> };

// Single order for the logged-in customer — scoped by customer_id so one
// customer can never read (or act on) another's order.
async function loadOwnOrder(orderId: string, customerId: string) {
  return queryOne<Record<string, unknown>>(
    `SELECT o.*,
       COALESCE(json_agg(json_build_object(
         'product_name', oi.product_name, 'product_image', oi.product_image,
         'price', oi.price, 'quantity', oi.quantity, 'subtotal', oi.subtotal
       )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1 AND o.customer_id = $2
     GROUP BY o.id`,
    [orderId, customerId]
  );
}

export async function GET(_: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await getOrCreateCustomer(user);
  if (!customer) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { orderId } = await params;
  const order = await loadOwnOrder(orderId, customer.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ data: order });
}

const ActionSchema = z.object({ action: z.enum(["confirm_payment", "confirm_delivery"]) });

// Customer-side confirmations:
//  - confirm_payment: bank-transfer buyer says "I've paid" → flags the order
//    for the admin to verify (payment_status = pending_confirmation).
//  - confirm_delivery: buyer confirms the shipped order arrived → delivered.
export async function POST(req: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await getOrCreateCustomer(user);
  if (!customer) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const parsed = ActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 422 });

  const { orderId } = await params;
  const order = await queryOne<{ id: string; payment_method: string; payment_status: string; order_status: string }>(
    "SELECT id, payment_method, payment_status, order_status FROM orders WHERE id = $1 AND customer_id = $2",
    [orderId, customer.id]
  );
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (parsed.data.action === "confirm_payment") {
    if (order.payment_method !== "bank_transfer" || order.payment_status !== "pending" || order.order_status === "cancelled") {
      return NextResponse.json({ error: "This order doesn't need a payment confirmation" }, { status: 400 });
    }
    await query(
      `UPDATE orders SET payment_status = 'pending_confirmation',
         payment_confirmed_by_customer_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [orderId]
    );
  } else {
    if (order.order_status !== "shipped") {
      return NextResponse.json({ error: "Only shipped orders can be confirmed as delivered" }, { status: 400 });
    }
    await query(
      `UPDATE orders SET order_status = 'delivered', delivery_confirmed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [orderId]
    );
  }

  const updated = await loadOwnOrder(orderId, customer.id);
  return NextResponse.json({ data: updated });
}
