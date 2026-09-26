import { verifySession } from "@/lib/auth";
import { getAffiliateBySession } from "@/lib/affiliates";
import { query } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { STATUS_LABEL, STATUS_STYLES, PAYMENT_LABEL } from "@/lib/account-orders";
import { DollarSign, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";

export const metadata = { title: "Affiliate Dashboard" };

interface AffiliateOrderRow {
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  subtotal: number | string;
  commission_amount: number | string;
}

const card = "bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800";

export default async function AffiliateDashboardPage() {
  const user = (await verifySession())!;
  const affiliate = (await getAffiliateBySession(user))!;

  const orders = await query<AffiliateOrderRow>(
    `SELECT order_number, created_at, order_status, payment_status, subtotal, commission_amount
     FROM orders WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [affiliate.id]
  );

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const link = `${baseUrl}/products?ref=${affiliate.code}`;

  const totalCommission = Number(affiliate.totalCommission ?? affiliate.total_commission ?? 0);
  const totalPaid = Number(affiliate.totalPaid ?? affiliate.total_paid ?? 0);
  const owed = Math.max(0, totalCommission - totalPaid);
  const orderCount = affiliate.orderCount ?? affiliate.order_count ?? 0;

  const stats = [
    { label: "Referred orders", value: orderCount, icon: ShoppingBag },
    { label: "Total earned", value: formatCurrency(totalCommission), icon: TrendingUp },
    { label: "Paid out", value: formatCurrency(totalPaid), icon: Wallet },
    { label: "Owed to you", value: formatCurrency(owed), icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {affiliate.isActive === false && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
          Your affiliate account is currently paused — your link won&apos;t earn commission until it&apos;s reactivated. Contact us if you think this is a mistake.
        </div>
      )}

      <section className={`${card} p-5`}>
        <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Your referral link</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Share this anywhere — your code rides along and earns you {Number(affiliate.commissionRate ?? affiliate.commission_rate ?? 0)}% commission on any order placed within 30 days of someone clicking it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono bg-transparent"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <CopyLinkButton link={link} />
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} p-4`}>
            <Icon className="w-4 h-4 mb-2" style={{ color: "var(--accent)" }} />
            <p className="text-lg sm:text-xl font-black" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <section className={`${card} p-5`}>
        <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Referred orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            No orders yet — once someone buys through your link, it&apos;ll show up here.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {orders.map((o) => (
              <div key={o.order_number} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{o.order_number}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDate(o.created_at)} · {PAYMENT_LABEL[o.payment_status] ?? o.payment_status}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_STYLES[o.order_status] ?? ""}`}>
                    {STATUS_LABEL[o.order_status] ?? o.order_status}
                  </span>
                  <p className="text-sm font-black mt-1" style={{ color: "var(--accent)" }}>
                    +{formatCurrency(Number(o.commission_amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
