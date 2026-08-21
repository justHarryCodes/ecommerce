import { redirect } from "next/navigation";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { query } from "@/lib/db";
import AccountClient from "./AccountClient";
import type { Order } from "@/types";

export const metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await verifySession();
  if (!user) redirect("/account/login?next=/account");

  const customer = await getOrCreateCustomer(user);
  if (!customer) redirect("/");

  const orders = await query<Order>(
    `SELECT o.*,
       json_agg(
         json_build_object(
           'product_name', oi.product_name,
           'product_image', oi.product_image,
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

  return <AccountClient customer={customer} orders={orders} email={user.email} />;
}
