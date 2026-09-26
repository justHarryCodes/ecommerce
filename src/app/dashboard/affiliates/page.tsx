import { verifySession, getUserStore } from "@/lib/auth";
import { query } from "@/lib/db";
import AffiliateManager from "@/components/dashboard/AffiliateManager";
import type { Affiliate } from "@/types";

export default async function AffiliatesPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const affiliates = await query<Affiliate>(
    `SELECT a.*, COUNT(o.id)::int AS order_count,
       COALESCE(SUM(o.commission_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_commission
     FROM affiliates a
     LEFT JOIN orders o ON o.affiliate_id = a.id
     WHERE a.store_id = $1
     GROUP BY a.id
     ORDER BY a.created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Affiliates</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Partners who earn commission on sales they refer via their own link.
        </p>
      </div>

      <AffiliateManager initialAffiliates={affiliates} />
    </div>
  );
}
