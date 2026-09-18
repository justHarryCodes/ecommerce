import { redirect } from "next/navigation";
import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import PortalNav from "./PortalNav";
import SignOutButton from "./SignOutButton";

// Shared chrome for the signed-in customer section (/account, /account/orders,
// /account/addresses, /account/profile). Login/signup live outside this group.
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession();
  // No ?next= here on purpose — the login page then routes by role
  // (admins → dashboard, customers → /account).
  if (!user) redirect("/account/login");

  const customer = await getOrCreateCustomer(user);
  if (!customer) redirect("/");

  const displayName = customer.name || user.displayName || user.email.split("@")[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>My Account</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {displayName} · {user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <PortalNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}
