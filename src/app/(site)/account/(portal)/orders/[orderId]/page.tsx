import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { getCustomerOrder, STATUS_LABEL, STATUS_STYLES, PAYMENT_LABEL, TRACK_STEPS } from "@/lib/account-orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Check, Package } from "lucide-react";
import OrderActions from "./OrderActions";

export const metadata = { title: "Order details" };

const card = "bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  // Guard against non-UUID ids hitting Postgres as a type error
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();

  const user = (await verifySession())!;
  const customer = (await getOrCreateCustomer(user))!;
  const order = await getCustomerOrder(customer.id, orderId);
  if (!order) notFound();

  const items = order.items.filter((i) => i.product_name);
  const cancelled = order.order_status === "cancelled";
  const stepIndex = TRACK_STEPS.indexOf(order.order_status as (typeof TRACK_STEPS)[number]);

  const needsPaymentConfirm =
    order.payment_method === "bank_transfer" && order.payment_status === "pending" && !cancelled;
  const canConfirmDelivery = order.order_status === "shipped";

  return (
    <div className="space-y-5">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4" /> All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{order.order_number}</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Placed {formatDateTime(order.created_at)}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${STATUS_STYLES[order.order_status]}`}>
          {STATUS_LABEL[order.order_status]}
        </span>
      </div>

      {/* Tracking */}
      <section className={card}>
        <h3 className="font-bold mb-5" style={{ color: "var(--text-primary)" }}>Track order</h3>
        {cancelled ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This order was cancelled.</p>
        ) : (
          <ol className="flex items-start">
            {TRACK_STEPS.map((step, i) => {
              const done = i <= stepIndex;
              return (
                <li key={step} className="flex-1 flex flex-col items-center text-center relative">
                  {i > 0 && (
                    <span
                      className="absolute top-3.5 right-1/2 w-full h-0.5"
                      style={{ background: i <= stepIndex ? "var(--accent)" : "var(--border)" }}
                    />
                  )}
                  <span
                    className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: done ? "var(--accent)" : "var(--surface, #fff)",
                      border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
                      color: done ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className="mt-2 text-[11px] leading-tight font-medium px-0.5" style={{ color: done ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {STATUS_LABEL[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {order.delivery_confirmed_at && (
          <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            You confirmed delivery on {formatDateTime(order.delivery_confirmed_at)}.
          </p>
        )}
      </section>

      {(needsPaymentConfirm || canConfirmDelivery) && (
        <OrderActions orderId={order.id} needsPaymentConfirm={needsPaymentConfirm} canConfirmDelivery={canConfirmDelivery} />
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Items */}
        <section className={`${card} md:col-span-2`}>
          <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Items</h3>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                {it.product_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.product_image} alt={it.product_name} className="w-14 h-14 rounded-xl object-cover border" style={{ borderColor: "var(--border)" }} />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--border)" }}>
                    <Package className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{it.product_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatCurrency(Number(it.price ?? 0))} × {it.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(Number(it.subtotal))}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
              <span>Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            {Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Delivery</span><span>{formatCurrency(Number(order.delivery_fee))}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base" style={{ color: "var(--text-primary)" }}>
              <span>Total</span><span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </section>

        <section className={card}>
          <h3 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Delivery</h3>
          <div className="text-sm space-y-0.5" style={{ color: "var(--text-secondary)" }}>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{order.customer_name}</p>
            <p>{order.delivery_address}</p>
            <p>{[order.delivery_city, order.delivery_state].filter(Boolean).join(", ")}</p>
            {order.customer_phone && <p>{order.customer_phone}</p>}
            {order.delivery_note && <p className="pt-2 text-xs italic">&ldquo;{order.delivery_note}&rdquo;</p>}
          </div>
        </section>

        <section className={card}>
          <h3 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Payment</h3>
          <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <p>{order.payment_method === "bank_transfer" ? "Bank transfer" : "Card / Paystack"}</p>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
