import Link from "next/link";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { listCustomerOrders, STATUS_LABEL, STATUS_STYLES, PAYMENT_LABEL } from "@/lib/account-orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package } from "lucide-react";

export const metadata = { title: "My Orders" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const user = (await verifySession())!;
  const customer = (await getOrCreateCustomer(user))!;
  const all = await listCustomerOrders(customer.id);

  const orders = all.filter((o) => {
    if (status === "active") return ["pending", "confirmed", "processing", "shipped"].includes(o.order_status);
    if (status === "delivered") return o.order_status === "delivered";
    if (status === "cancelled") return o.order_status === "cancelled";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = status === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/account/orders" : `/account/orders?status=${f.key}`}
              className="px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border)",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-12 text-center">
          <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {all.length === 0 ? "No orders yet — items you buy will show up here." : "No orders match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const items = o.items.filter((i) => i.product_name);
            return (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="block bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{o.order_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_STYLES[o.order_status]}`}>
                      {STATUS_LABEL[o.order_status]}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(o.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {items.slice(0, 4).map((it, i) =>
                    it.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={it.product_image} alt={it.product_name} className="w-12 h-12 rounded-lg object-cover border" style={{ borderColor: "var(--border)" }} />
                    ) : (
                      <div key={i} className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--border)" }}>
                        <Package className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      </div>
                    )
                  )}
                  <p className="text-xs ml-1" style={{ color: "var(--text-secondary)" }}>
                    {items.length} item{items.length !== 1 ? "s" : ""}
                    {items.length > 4 ? ` (+${items.length - 4} more)` : ""}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {PAYMENT_LABEL[o.payment_status] ?? o.payment_status}
                  </span>
                  <span className="font-black" style={{ color: "var(--text-primary)" }}>{formatCurrency(Number(o.total))}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
