import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getAffiliateBySession } from "@/lib/affiliates";
import SignOutButton from "../../account/(portal)/SignOutButton";

// Gated affiliate dashboard. Not signed in, or signed in but no affiliate
// profile yet — either way, /affiliate/signup is the right destination: it
// detects an existing session and shows a short "complete your profile"
// form instead of asking them to create a new account.
export const dynamic = "force-dynamic";

export default async function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession();
  if (!user) redirect("/affiliate/signup");

  const affiliate = await getAffiliateBySession(user);
  if (!affiliate) redirect("/affiliate/signup");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Affiliate Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{affiliate.name}</p>
        </div>
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}
