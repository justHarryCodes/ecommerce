"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart } from "lucide-react";
import { clLogo } from "@/lib/cloudinary";
import { useCart } from "./CartProvider";
import CartDrawer from "./CartDrawer";
import type { Store } from "@/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

interface Props {
  company: Store | null;
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

export default function SiteNav({ company }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const companyName = company?.name ?? "Forge & Form";
  const logoUrl = company?.logoUrl ?? company?.logo_url ?? null;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="shrink-0 flex items-center gap-2">
              {logoUrl ? (
                <img src={clLogo(logoUrl)} alt={companyName} className="h-9 w-auto object-contain" />
              ) : (
                <span className="text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {companyName}
                </span>
              )}
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-1">
              <CartButton onClick={() => setCartOpen(true)} className="hover:bg-black/5 dark:hover:bg-white/5" />
              <Link
                href="/contact"
                className="ml-2 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Get a Free Quote
              </Link>
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="flex lg:hidden items-center gap-1">
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
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-16 left-0 right-0 z-40 lg:hidden transition-all duration-300 ease-in-out ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center px-4 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Get a Free Quote
          </Link>
        </div>
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} company={company} />
    </>
  );
}
