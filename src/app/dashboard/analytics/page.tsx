import { verifySession, getUserStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ShoppingBag, MessageSquare, Receipt } from "lucide-react";
import { RevenueLineChart, TopProductsBars, LeadsFunnel } from "@/components/dashboard/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);
  const storeId = store!.id;

  const [kpis, dailyRevenue, topProducts, leadStatus] = await Promise.all([
    queryOne<{ revenue_30d: string; orders_30d: string; leads_30d: string }>(
      `SELECT
         COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_30d,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS orders_30d,
         (SELECT COUNT(*) FROM quote_requests WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '30 days') AS leads_30d
       FROM orders WHERE store_id = $1`,
      [storeId]
    ),
    query<{ day: string; revenue: string }>(
      `SELECT d::date AS day, COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0) AS revenue
       FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') d
       LEFT JOIN orders o ON o.store_id = $1 AND date_trunc('day', o.created_at) = d
       GROUP BY d ORDER BY d`,
      [storeId]
    ),
    query<{ product_name: string; revenue: string }>(
      `SELECT oi.product_name, SUM(oi.subtotal) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.store_id = $1 AND o.payment_status = 'paid'
       GROUP BY oi.product_name
       ORDER BY revenue DESC
       LIMIT 5`,
      [storeId]
    ),
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count FROM quote_requests WHERE store_id = $1 GROUP BY status`,
      [storeId]
    ),
  ]);

  const revenue30d = parseFloat(kpis?.revenue_30d ?? "0");
  const orders30d = parseInt(kpis?.orders_30d ?? "0");
  const leads30d = parseInt(kpis?.leads_30d ?? "0");
  const avgOrderValue = orders30d > 0 ? revenue30d / orders30d : 0;

  const revenuePoints = dailyRevenue.map((r) => ({ day: r.day, revenue: parseFloat(r.revenue) }));
  const topProductsData = topProducts.map((p) => ({ product_name: p.product_name, revenue: parseFloat(p.revenue) }));
  const leadCounts = leadStatus.map((s) => ({ status: s.status, count: parseInt(s.count) }));

  const statCards = [
    { label: "Revenue (30d)", value: formatCurrency(revenue30d), icon: TrendingUp, color: "bg-green-50 dark:bg-green-950/30 text-green-600" },
    { label: "Orders (30d)", value: orders30d, icon: ShoppingBag, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600" },
    { label: "Leads (30d)", value: leads30d, icon: MessageSquare, color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600" },
    { label: "Avg order value", value: formatCurrency(avgOrderValue), icon: Receipt, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">Last 30 days, from orders and quote requests</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-surface-900 dark:text-white mb-1">{card.value}</div>
              <div className="text-xs text-surface-500 dark:text-surface-400 font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue trend */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5">
        <h2 className="font-bold text-surface-900 dark:text-white mb-4">Revenue — last 30 days</h2>
        <RevenueLineChart points={revenuePoints} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5">
          <h2 className="font-bold text-surface-900 dark:text-white mb-4">Top products by revenue</h2>
          <TopProductsBars products={topProductsData} />
        </div>

        {/* Leads funnel */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5">
          <h2 className="font-bold text-surface-900 dark:text-white mb-4">Leads by status</h2>
          <LeadsFunnel counts={leadCounts} />
        </div>
      </div>
    </div>
  );
}
