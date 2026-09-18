"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { User as UserIcon, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/firebase-client";
import NavDropdown, { type NavDropdownItem } from "./NavDropdown";
import { useViewer } from "./ViewerProvider";

// The header's 4th group. Same slot, same look as Collections / Company /
// Work — only what's inside changes with who is signed in:
//   signed out → Sign In, Create Account
//   customer   → "Account": Overview, Orders, Addresses, Profile, Sign out
//   admin      → "Dashboard": links into the admin area, Sign out

const CUSTOMER_ITEMS: NavDropdownItem[] = [
  { href: "/account", label: "My Account", description: "Overview & recent orders" },
  { href: "/account/orders", label: "My Orders", description: "Track & confirm orders" },
  { href: "/account/addresses", label: "Delivery Addresses" },
  { href: "/account/profile", label: "Profile & Password" },
];

const ADMIN_ITEMS: NavDropdownItem[] = [
  { href: "/dashboard", label: "Overview", description: "Manage the whole site" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/quote-requests", label: "Quote Requests" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

const GUEST_ITEMS: NavDropdownItem[] = [
  { href: "/account/login", label: "Sign In" },
  { href: "/account/signup", label: "Create Account" },
];

async function fullSignOut() {
  await signOut(auth).catch(() => {});
  await fetch("/api/auth/logout", { method: "POST" });
}

function useSignOut(after?: () => void) {
  const router = useRouter();
  const { clear } = useViewer();
  return async () => {
    await fullSignOut();
    clear();
    after?.();
    router.push("/");
    router.refresh();
  };
}

export function AccountDropdown({ align }: { align?: "left" | "right" }) {
  const { viewer } = useViewer();
  const handleSignOut = useSignOut();

  // Still working out who is signed in — neutral label, no Sign In flash
  if (viewer === undefined) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium py-2" style={{ color: "var(--text-secondary)" }}>
        <UserIcon className="w-4 h-4" /> Account
      </div>
    );
  }

  if (!viewer) {
    return <NavDropdown label="Account" icon={<UserIcon className="w-4 h-4" />} items={GUEST_ITEMS} align={align} />;
  }

  if (viewer.isAdmin) {
    return (
      <NavDropdown
        label="Dashboard"
        icon={<LayoutDashboard className="w-4 h-4" />}
        items={ADMIN_ITEMS}
        action={{ label: "Sign out", onClick: handleSignOut }}
        align={align}
      />
    );
  }

  return (
    <NavDropdown
      label="Account"
      icon={<UserIcon className="w-4 h-4" />}
      items={CUSTOMER_ITEMS}
      action={{ label: "Sign out", onClick: handleSignOut }}
      align={align}
    />
  );
}

export function MobileAccountGroup({ onNavigate }: { onNavigate: () => void }) {
  const { viewer } = useViewer();
  const handleSignOut = useSignOut(onNavigate);

  if (viewer === undefined) return null;

  const items = !viewer ? GUEST_ITEMS : viewer.isAdmin ? ADMIN_ITEMS : CUSTOMER_ITEMS;
  const title = viewer?.isAdmin ? "Dashboard" : "Account";
  const row = "text-left px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80";

  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <div className="flex flex-col">
        {items.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={row} style={{ color: "var(--text-primary)" }}>
            {item.label}
          </Link>
        ))}
        {viewer && (
          <button onClick={handleSignOut} className={row} style={{ color: "var(--text-primary)" }}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
