import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube, Globe, MessageCircle } from "lucide-react";
import { waLink } from "@/lib/utils";
import NewsletterForm from "./NewsletterForm";
import type { Store, Category } from "@/types";

interface Props {
  company: Store | null;
  categories?: Category[];
}

const COMPANY_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/careers", label: "Careers" },
];

const HELP_LINKS = [
  { href: "/contact", label: "Contact us" },
  { href: "/account", label: "My account" },
  { href: "/account/orders", label: "Track an order" },
  { href: "/affiliate/signup", label: "Become an affiliate" },
];

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
};

const linkCls =
  "text-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:underline";

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkCls}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter({ company, categories = [] }: Props) {
  const companyName = company?.name ?? "Build&Funish";
  const description = company?.description;
  const phone = company?.phone;
  const email = company?.email;
  const address = company?.address;
  const whatsapp = company?.whatsapp;
  const socialLinks = company?.socialLinks ?? company?.social_links ?? {};

  const shopLinks = [
    { href: "/products", label: "All products" },
    ...categories.slice(0, 5).map((c) => ({ href: `/products?category=${c.slug}`, label: c.name })),
  ];

  return (
    <footer className="mt-8" style={{ background: "var(--ink)", color: "var(--ink-muted)" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.5fr] lg:px-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-xl font-extrabold tracking-tight text-white">
            {companyName}<span style={{ color: "var(--accent)" }} aria-hidden="true">.</span>
          </p>
          {description && <p className="mt-3 max-w-xs text-sm leading-relaxed">{description}</p>}
          <ul className="mt-5 space-y-2.5 text-sm">
            {phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`tel:${phone}`} className={linkCls}>{phone}</a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:${email}`} className={`${linkCls} break-all`}>{email}</a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{address}</span>
              </li>
            )}
          </ul>
          {Object.keys(socialLinks).length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              {Object.entries(socialLinks).map(([key, url]) => {
                if (!url) return null;
                const Icon = SOCIAL_ICONS[key.toLowerCase()] ?? Globe;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <Column title="Shop" links={shopLinks} />
        <Column title="Company" links={COMPANY_LINKS} />
        <Column title="Help" links={HELP_LINKS} />

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-1">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">Newsletter</h3>
          <p className="mb-4 text-sm">New products, project stories and offers — straight to your inbox.</p>
          <NewsletterForm />
          {whatsapp && (
            <a
              href={waLink(whatsapp, "Hi, I'd like to know more about your services.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white"
              style={{ color: "var(--accent-light)" }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat with us on WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-xs sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <Link href="/terms" className={linkCls.replace("text-sm", "text-xs")}>Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
