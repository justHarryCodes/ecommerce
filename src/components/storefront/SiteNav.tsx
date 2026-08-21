"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, ShoppingCart, User as UserIcon, LogOut } from "lucide-react";
import { signOut, type User } from "firebase/auth";
import { auth, onAuthStateChanged } from "@/lib/firebase-client";
import { clLogo } from "@/lib/cloudinary";
import { useCart } from "./CartProvider";
import CartDrawer from "./CartDrawer";
import NavDropdown, { type NavDropdownItem } from "./NavDropdown";
import SearchBar from "./SearchBar";
import type { Store, Category } from "@/types";

// Header is grouped into 4 dropdowns instead of a long flat link list:
// Collections (product categories), Company, Work, Account.
const COMPANY_LINKS: NavDropdownItem[] = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];
const WORK_LINKS: NavDropdownItem[] = [
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
];

interface Props {
  company: Store | null;
  categories: Category[];
}

function CartButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { totalItems } = useCart();
  return (
    <button
      onClick={onClick}
      aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
      className={`relative p-2 rounded-lg transition-colors ${className ?? ""}`}
      style={{ color: "var(--text-primary)" }}
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}

// Account dropdown swaps its items based on live Firebase auth state —
// same session cookie/project as staff, role is just decided elsewhere.
function AccountDropdown({ align }: { align?: "left" | "right" }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium py-2" style={{ color: "var(--text-secondary)" }}>
        <UserIcon className="w-4 h-4" /> Account
      </div>
    );
  }

  const items: NavDropdownItem[] = user
    ? [{ href: "/account", label: "My Account", description: "Profile, address & orders" }]
    : [
        { href: "/account/login", label: "Sign In" },
        { href: "/account/signup", label: "Create Account" },
      ];

  return (
    <div className="flex items-center">
      <NavDropdown label="Account" icon={<UserIcon className="w-4 h-4" />} items={items} align={align} />
      {user && (
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 ml-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function SiteNav({ company, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const companyName = company?.name ?? "Forge & Form";
  const logoUrl = company?.logoUrl ?? company?.logo_url ?? null;

  const collectionItems: NavDropdownItem[] = categories.map((c) => ({
    href: `/products?category=${c.slug}`,
    label: c.name,
  }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body-scroll-lock + Escape-to-close for the mobile panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-sm transition-shadow"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="shrink-0 flex items-center gap-2">
              {logoUrl ? (
                <img src={clLogo(logoUrl)} alt={companyName} className="h-9 w-auto object-contain" />
              ) : (
                <span className="text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {companyName}
                </span>
              )}
            </Link>

            {/* Desktop nav groups */}
            <div className="hidden lg:flex items-center gap-5 shrink-0">
              <NavDropdown label="Collections" items={collectionItems} footer={{ href: "/products", label: "View All Products" }} />
              <NavDropdown label="Company" items={COMPANY_LINKS} />
              <NavDropdown label="Work" items={WORK_LINKS} />
            </div>

            {/* Desktop search — inline, always visible */}
            <div className="hidden lg:block flex-1 max-w-sm">
              <SearchBar />
            </div>

            {/* Desktop right side */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <AccountDropdown align="right" />
              <CartButton onClick={() => setCartOpen(true)} className="hover:bg-black/5 dark:hover:bg-white/5" />
              <Link
                href="/contact"
                className="ml-2 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: "var(--accent)" }}
              >
                Get a Free Quote
              </Link>
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="flex lg:hidden items-center gap-1 shrink-0">
              <CartButton onClick={() => setCartOpen(true)} />
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search — always visible, own row */}
          <div className="lg:hidden pb-3">
            <SearchBar />
          </div>

          {/* Mobile menu panel — anchored to this relative container's own
              bottom edge (top-full), so it sits exactly below the
              header+search rows regardless of their rendered height, no
              pixel guessing required. */}
          <div
            className={`absolute top-full left-0 right-0 z-40 lg:hidden transition-all duration-300 ease-in-out ${
              open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
            }`}
            style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
          >
            <div className="px-4 py-4 flex flex-col gap-5 max-h-[calc(100dvh-8rem)] overflow-y-auto">
              <MobileGroup title="Collections" items={collectionItems} onNavigate={() => setOpen(false)} />
              <MobileGroup title="Company" items={COMPANY_LINKS} onNavigate={() => setOpen(false)} />
              <MobileGroup title="Work" items={WORK_LINKS} onNavigate={() => setOpen(false)} />
              <MobileAccountGroup onNavigate={() => setOpen(false)} />

              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center px-4 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Get a Free Quote
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} company={company} />
    </>
  );
}

function MobileGroup({ title, items, onNavigate }: { title: string; items: NavDropdownItem[]; onNavigate: () => void }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <div className="flex flex-col">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--text-primary)" }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileAccountGroup({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    onNavigate();
    router.push("/");
    router.refresh();
  }

  if (!ready) return null;

  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
        Account
      </p>
      <div className="flex flex-col">
        {user ? (
          <>
            <Link
              href="/account"
              onClick={onNavigate}
              className="px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              My Account
            </Link>
            <button
              onClick={handleSignOut}
              className="text-left px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/account/login"
              onClick={onNavigate}
              className="px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              Sign In
            </Link>
            <Link
              href="/account/signup"
              onClick={onNavigate}
              className="px-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              Create Account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
