import Link from "next/link";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { query } from "@/lib/db";
import { listCustomerOrders, STATUS_LABEL, STATUS_STYLES, PAYMENT_LABEL } from "@/lib/account-orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, Truck, CheckCircle2, MapPin, ArrowRight, AlertCircle } from "lucide-react";

export const metadata = { title: "My Account" };

const card = "bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800";

export default async function AccountOverviewPage() {
  const user = (await verifySession())!;
  const customer = (await getOrCreateCustomer(user))!;

  const [orders, addresses] = await Promise.all([
    listCustomerOrders(customer.id),
    query<{ label: string; recipient_name: string; address: string; city: string | null; state: string | null }>(
      "SELECT * FROM customer_addresses WHERE customer_id = $1 AND is_default LIMIT 1",
      [customer.id]
    ),
  ]);
  const defaultAddress = addresses[0];

  const inProgress = orders.filter((o) => ["pending", "confirmed", "processing", "shipped"].includes(o.order_status));
  const delivered = orders.filter((o) => o.order_status === "delivered");
  const awaitingReceipt = orders.filter((o) => o.order_status === "shipped");
  const awaitingPayment = orders.filter(
    (o) => o.payment_method === "bank_transfer" && o.payment_status === "pending" && o.order_status !== "cancelled"
  );

  const stats = [
    { label: "Total orders", value: orders.length, icon: Package },
    { label: "In progress", value: inProgress.length, icon: Truck },
    { label: "Delivered", value: delivered.length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {(awaitingReceipt.length > 0 || awaitingPayment.length > 0) && (
        <div className="rounded-2xl border p-4 flex gap-3" style={{ borderColor: "var(--accent)", background: "var(--accent-light)" }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            {awaitingReceipt.map((o) => (
              <p key={o.id}>
                Order <strong>{o.order_number}</strong> is on its way —{" "}
                <Link href={`/account/orders/${o.id}`} className="font-semibold underline">confirm once it arrives</Link>.
              </p>
            ))}
            {awaitingPayment.map((o) => (
              <p key={o.id}>
                Order <strong>{o.order_number}</strong> is awaiting your bank transfer —{" "}
                <Link href={`/account/orders/${o.id}`} className="font-semibold underline">let us know when you&apos;ve paid</Link>.
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} p-4`}>
            <Icon className="w-4 h-4 mb-2" style={{ color: "var(--accent)" }} />
            <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className={`${card} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Recent orders</h2>
            {orders.length > 0 && (
              <Link href="/account/orders" className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>You haven&apos;t placed any orders yet.</p>
              <Link href="/products" className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "var(--accent)" }}>
                Browse products
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {orders.slice(0, 3).map((o) => (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{o.order_number}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(o.created_at)} · {PAYMENT_LABEL[o.payment_status] ?? o.payment_status}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_STYLES[o.order_status]}`}>
                      {STATUS_LABEL[o.order_status]}
                    </span>
                    <p className="text-sm font-black mt-1" style={{ color: "var(--text-primary)" }}>{formatCurrency(Number(o.total))}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <MapPin className="w-4 h-4" /> Delivery address
            </h2>
            <Link href="/account/addresses" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
              {defaultAddress ? "Manage" : "Add"}
            </Link>
          </div>
          {defaultAddress ? (
            <div className="text-sm space-y-0.5" style={{ color: "var(--text-secondary)" }}>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{defaultAddress.recipient_name}</p>
              <p>{defaultAddress.address}</p>
              <p>{[defaultAddress.city, defaultAddress.state].filter(Boolean).join(", ")}</p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Save a delivery address so checkout is prefilled next time.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
