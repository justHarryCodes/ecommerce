"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import {
  ChevronDown, User as UserIcon, LogOut, Package, MapPin, UserCog, LayoutDashboard,
} from "lucide-react";
import { auth } from "@/lib/firebase-client";
import NavDropdown from "./NavDropdown";
import { useViewer, type Viewer } from "./ViewerProvider";

export type { Viewer };


async function fullSignOut() {
  await signOut(auth).catch(() => {});
  await fetch("/api/auth/logout", { method: "POST" });
}

function memberLinks(isAdmin: boolean) {
  return [
    { href: "/account", label: "My Account", icon: UserIcon },
    { href: "/account/orders", label: "My Orders", icon: Package },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/profile", label: "Profile", icon: UserCog },
    ...(isAdmin ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
  ];
}

// Desktop header: signed in → avatar + first name with the full account menu;
// signed out → Sign In / Create Account dropdown.
export function AccountDropdown({ align }: { align?: "left" | "right" }) {
  const { viewer, clear } = useViewer();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (viewer === undefined) {
    // Still working out who is signed in — neutral label, no Sign In flash
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium py-2" style={{ color: "var(--text-secondary)" }}>
        <UserIcon className="w-4 h-4" /> Account
      </div>
    );
  }

  if (!viewer) {
    return (
      <NavDropdown
        label="Account"
        icon={<UserIcon className="w-4 h-4" />}
        items={[
          { href: "/account/login", label: "Sign In" },
          { href: "/account/signup", label: "Create Account" },
        ]}
        align={align}
      />
    );
  }

  const firstName = viewer.name.split(" ")[0];

  async function handleSignOut() {
    setOpen(false);
    await fullSignOut();
    clear();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 py-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase"
          style={{ background: "var(--accent)" }}
        >
          {firstName.charAt(0)}
        </span>
        <span className="max-w-[7rem] truncate">{firstName}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-64 rounded-2xl border shadow-lg py-2 z-50 ${align === "left" ? "left-0" : "right-0"}`}
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        >
          <div className="px-4 py-2.5 mb-1 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{viewer.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{viewer.email}</p>
          </div>
          {memberLinks(viewer.isAdmin).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: "var(--text-primary)" }}
            >
              <Icon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              {label}
            </Link>
          ))}
          <div className="my-1.5 border-t" style={{ borderColor: "var(--border)" }} />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-primary)" }}
          >
            <LogOut className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileAccountGroup({ onNavigate }: { onNavigate: () => void }) {
  const { viewer, clear } = useViewer();
  const router = useRouter();

  async function handleSignOut() {
    await fullSignOut();
    clear();
    onNavigate();
    router.push("/");
    router.refresh();
  }

  if (viewer === undefined) return null;

  const row = "text-left px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80";

  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
        {viewer ? viewer.name : "Account"}
      </p>
      <div className="flex flex-col">
        {viewer ? (
          <>
            {memberLinks(viewer.isAdmin).map(({ href, label }) => (
              <Link key={href} href={href} onClick={onNavigate} className={row} style={{ color: "var(--text-primary)" }}>
                {label}
              </Link>
            ))}
            <button onClick={handleSignOut} className={row} style={{ color: "var(--text-primary)" }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/account/login" onClick={onNavigate} className={row} style={{ color: "var(--text-primary)" }}>
              Sign In
            </Link>
            <Link href="/account/signup" onClick={onNavigate} className={row} style={{ color: "var(--text-primary)" }}>
              Create Account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
