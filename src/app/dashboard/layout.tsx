import { redirect } from "next/navigation";
import { verifySession, getUserStore, getCompany, isAdminEmail } from "@/lib/auth";
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
    // Two distinct causes share this null: the company row hasn't been
    // seeded yet (migration not run), or this is a logged-in user who
    // just isn't on the ADMIN_EMAILS allow-list (e.g. a customer).
    const companyExists = await getCompany();
    const notAuthorized = companyExists && !isAdminEmail(user.email);

    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
            {notAuthorized ? "Not authorized" : "Company profile not found"}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {notAuthorized ? (
              <>
                {user.email} doesn&apos;t have dashboard access. If this is a mistake, ask an
                admin to add your email to <code>ADMIN_EMAILS</code>.
              </>
            ) : (
              <>
                Run <code>migrations/002_company_pivot.sql</code> against this
                database to seed the company profile before using the dashboard.
              </>
            )}
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
