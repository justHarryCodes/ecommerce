import { NextResponse } from "next/server";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Order } from "@/types";

// Order history for the logged-in customer — scoped strictly to their
// own customer_id, never exposes other customers' orders.
export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await getOrCreateCustomer(user);
  if (!customer) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const orders = await query<Order>(
    `SELECT o.*,
       json_agg(
         json_build_object(
           'product_name', oi.product_name,
           'product_image', oi.product_image,
           'price', oi.price,
           'quantity', oi.quantity,
           'subtotal', oi.subtotal
         )
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [customer.id]
  );

  return NextResponse.json({ data: orders });
}
