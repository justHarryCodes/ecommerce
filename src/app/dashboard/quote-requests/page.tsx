import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import { MessageSquare } from "lucide-react";
import type { QuoteRequest, QuoteRequestStatus } from "@/types";
import QuoteRequestRow from "@/components/dashboard/QuoteRequestRow";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: QuoteRequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function QuoteRequestsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const leads = await queryMany<QuoteRequest>(
    status
      ? `SELECT * FROM quote_requests WHERE store_id = $1 AND status = $2 ORDER BY created_at DESC`
      : `SELECT * FROM quote_requests WHERE store_id = $1 ORDER BY created_at DESC`,
    status ? [store!.id, status] : [store!.id]
  );

  const newCount = await queryMany<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM quote_requests WHERE store_id = $1 AND status = 'new'`,
    [store!.id]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Leads</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {leads.length} quote request{leads.length !== 1 ? "s" : ""}
          {newCount[0]?.count && parseInt(newCount[0].count) > 0
            ? ` · ${newCount[0].count} new`
            : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = (status ?? "all") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/dashboard/quote-requests" : `/dashboard/quote-requests?status=${tab.value}`}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                active
                  ? "bg-accent-400 border-accent-400 text-black"
                  : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-16 text-center">
          <MessageSquare className="w-12 h-12 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            No leads yet
          </h3>
          <p className="text-sm text-surface-400">
            Quote requests submitted from the site will show up here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 divide-y divide-surface-50 dark:divide-surface-800">
          {leads.map((lead) => (
            <QuoteRequestRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
