import { redirect } from "next/navigation";
import { verifySession, getUserStore } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DashboardBottomNav from "@/components/dashboard/DashboardBottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();
  if (!user) redirect("/auth/login");

  const store = await getUserStore(user.firebaseUid);
  if (!store) {
    // Should only happen before migrations/002_company_pivot.sql has been
    // run against the target database — the company row is seeded there.
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
            Company profile not found
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Run <code>migrations/002_company_pivot.sql</code> against this
            database to seed the company profile before using the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        store={{
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl ?? store.logo_url,
        }}
      />

      {/* Main — offset by sidebar width on desktop, full width on mobile */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} store={store} />
        {/* pt-14 = mobile header height; pb-16 = mobile bottom nav height */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-14 lg:pt-6 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav + FAB */}
      <DashboardBottomNav />
    </div>
  );
}
