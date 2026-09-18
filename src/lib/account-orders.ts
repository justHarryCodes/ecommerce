import { query } from "./db";

export interface PortalOrderItem {
  product_name: string;
  product_image?: string | null;
  price?: number | string;
  quantity: number;
  subtotal: number | string;
}

export interface PortalOrder {
  id: string;
  order_number: string;
  order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: string;
  payment_method: string;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_note?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  delivery_confirmed_at?: string | null;
  items: PortalOrderItem[];
}

const ORDER_SELECT = `
  SELECT o.*,
    COALESCE(json_agg(json_build_object(
      'product_name', oi.product_name, 'product_image', oi.product_image,
      'price', oi.price, 'quantity', oi.quantity, 'subtotal', oi.subtotal
    )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id`;

export function listCustomerOrders(customerId: string) {
  return query<PortalOrder>(
    `${ORDER_SELECT} WHERE o.customer_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
    [customerId]
  );
}

export async function getCustomerOrder(customerId: string, orderId: string) {
  const rows = await query<PortalOrder>(
    `${ORDER_SELECT} WHERE o.customer_id = $1 AND o.id = $2 GROUP BY o.id`,
    [customerId, orderId]
  );
  return rows[0] ?? null;
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
  processing: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800",
  delivered: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
  cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
};

export const PAYMENT_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  pending_confirmation: "Payment being verified",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  rejected: "Payment rejected",
};

// Order of the tracking timeline (cancelled is shown separately)
export const TRACK_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
