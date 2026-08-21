import { verifySession, getUserStore } from "@/lib/auth";
import { queryOne, queryMany } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  MessageSquare,
  Package,
  Building2,
  Newspaper,
  Clock,
  ArrowRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import type { QuoteRequest } from "@/types";
import { Tip } from "@/components/dashboard/Tip";

export const dynamic = "force-dynamic";

async function getDashboardStats(storeId: string) {
  const [counts, recentLeads] = await Promise.all([
    queryOne<{
      total_leads: string;
      new_leads: string;
      total_products: string;
      total_projects: string;
      published_posts: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM quote_requests WHERE store_id = $1) AS total_leads,
         (SELECT COUNT(*) FROM quote_requests WHERE store_id = $1 AND status = 'new') AS new_leads,
         (SELECT COUNT(*) FROM products WHERE store_id = $1 AND is_active = true) AS total_products,
         (SELECT COUNT(*) FROM projects WHERE store_id = $1) AS total_projects,
         (SELECT COUNT(*) FROM blog_posts WHERE store_id = $1 AND is_published = true) AS published_posts
      `,
      [storeId]
    ),
    queryMany<QuoteRequest>(
      `SELECT * FROM quote_requests WHERE store_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [storeId]
    ),
  ]);

  return {
    stats: {
      total_leads: parseInt(counts?.total_leads ?? "0"),
      new_leads: parseInt(counts?.new_leads ?? "0"),
      total_products: parseInt(counts?.total_products ?? "0"),
      total_projects: parseInt(counts?.total_projects ?? "0"),
      published_posts: parseInt(counts?.published_posts ?? "0"),
    },
    recentLeads,
  };
}

export default async function DashboardPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);
  const { stats, recentLeads } = await getDashboardStats(store!.id);

  const statCards = [
    {
      label: "Total leads",
      value: stats.total_leads,
      icon: MessageSquare,
      color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600",
      sub: stats.new_leads > 0 ? `${stats.new_leads} new` : undefined,
    },
    {
      label: "Active products",
      value: stats.total_products,
      icon: Package,
      color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600",
    },
    {
      label: "Projects",
      value: stats.total_projects,
      icon: Building2,
      color: "bg-green-50 dark:bg-green-950/30 text-green-600",
    },
    {
      label: "Published posts",
      value: stats.published_posts,
      icon: Newspaper,
      color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Overview
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Welcome back! Here&apos;s what&apos;s happening with the site.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"
        >
          View public site <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <Tip id="dash-start" variant="info">
        <strong>How this dashboard works:</strong> Visitors browsing the site submit quote requests from product/service/project pages and the Contact form — those land in Leads. Add products, services, and projects to build out the catalog and portfolio.
      </Tip>

      {stats.total_products === 0 && (
        <div className="rounded-2xl bg-accent-50 dark:bg-accent-950/20 border border-accent-200 dark:border-accent-800 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🚀</div>
            <div className="flex-1">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
                The site is ready! Add your first product.
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                Start by adding products to the catalog so visitors can browse and request quotes.
              </p>
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all"
              >
                Add first product <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-surface-900 dark:text-white mb-1">
                {card.value}
              </div>
              <div className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                {card.label}
              </div>
              {card.sub && (
                <div className="text-xs text-blue-500 font-semibold mt-0.5">{card.sub}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/products/new", label: "Add product", emoji: "📦" },
          { href: "/dashboard/projects/new", label: "Add project", emoji: "🏗️" },
          { href: "/dashboard/quote-requests", label: "View leads", emoji: "💬" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 hover:border-accent-300 dark:hover:border-accent-700 transition-all group"
          >
            <span className="text-2xl">{action.emoji}</span>
            <span className="font-medium text-sm text-surface-900 dark:text-white">
              {action.label}
            </span>
            <ArrowRight className="w-4 h-4 ml-auto text-surface-300 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800">
        <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-800">
          <h2 className="font-semibold text-surface-900 dark:text-white">
            Recent leads
          </h2>
          <Link
            href="/dashboard/quote-requests"
            className="text-sm text-accent-600 dark:text-accent-400 hover:underline font-medium"
          >
            View all
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-surface-200 dark:text-surface-700 mx-auto mb-3" />
            <p className="text-surface-400 text-sm">No leads yet</p>
            <p className="text-surface-300 dark:text-surface-600 text-xs mt-1">
              Quote requests submitted from the site will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-50 dark:divide-surface-800">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href="/dashboard/quote-requests"
                className="flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-400 shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-surface-900 dark:text-white truncate">
                      {lead.name}
                    </div>
                    <div className="text-xs text-surface-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full border font-medium border-blue-300 text-blue-700 dark:text-blue-400">
                    {lead.status ?? "new"}
                  </span>
                  <span className="text-xs text-surface-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(lead.createdAt ?? lead.created_at ?? "")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
