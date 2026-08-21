import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Mail, Phone } from "lucide-react";
import type { Customer } from "@/types";

export default async function CustomersPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const customers = await queryMany<Customer>(
    `SELECT c.*,
       COUNT(o.id)::int AS order_count,
       COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_spent
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     WHERE c.store_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Customers</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-16 text-center">
          <Users className="w-12 h-12 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">No customers yet</h3>
          <p className="text-sm text-surface-400">
            Visitors who create an account on the site will show up here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Orders</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Total spent</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-400 shrink-0 inline-flex mr-2 align-middle">
                        {(c.name ?? c.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-surface-900 dark:text-white align-middle">
                        {c.name ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-surface-500 dark:text-surface-400">
                      <div className="flex items-center gap-1.5">
                        {c.email && <><Mail className="w-3 h-3" /> {c.email}</>}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-surface-700 dark:text-surface-300">
                      {(c as unknown as { order_count: number }).order_count ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-surface-900 dark:text-white">
                      {formatCurrency(Number((c as unknown as { total_spent: number }).total_spent ?? 0))}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-surface-400">
                      {formatDate(c.createdAt ?? c.created_at ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-surface-100 dark:divide-surface-800">
            {customers.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm text-surface-900 dark:text-white">{c.name ?? "—"}</span>
                  <span className="text-xs text-surface-400">{formatDate(c.createdAt ?? c.created_at ?? "")}</span>
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">{c.email}</div>
                {c.phone && <div className="text-xs text-surface-500 dark:text-surface-400">{c.phone}</div>}
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-surface-500 dark:text-surface-400">
                    {(c as unknown as { order_count: number }).order_count ?? 0} order(s)
                  </span>
                  <span className="font-semibold text-surface-900 dark:text-white">
                    {formatCurrency(Number((c as unknown as { total_spent: number }).total_spent ?? 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
