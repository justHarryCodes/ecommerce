import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube, Globe } from "lucide-react";
import { waLink } from "@/lib/utils";
import NewsletterForm from "./NewsletterForm";
import type { Store } from "@/types";

interface Props {
  company: Store | null;
}

const QUICK_LINKS = [
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

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
};

export default function SiteFooter({ company }: Props) {
  const companyName = company?.name ?? "BINTED";
  const description = company?.description;
  const phone = company?.phone;
  const email = company?.email;
  const address = company?.address;
  const whatsapp = company?.whatsapp;
  const socialLinks = company?.socialLinks ?? company?.social_links ?? {};

  return (
    <footer style={{ background: "#1a1410", color: "rgba(255,255,255,0.7)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Company blurb */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-black text-white mb-3">{companyName}</h3>
          {description && <p className="text-sm leading-relaxed mb-5">{description}</p>}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex items-center gap-3">
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
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact details */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            {phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors break-all">{email}</a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
            )}
            {whatsapp && (
              <li>
                <a
                  href={waLink(whatsapp, "Hi, I'd like to know more about your services.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-1 text-sm font-semibold hover:text-white transition-colors"
                  style={{ color: "var(--accent-light)" }}
                >
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Stay Updated</h4>
          <p className="text-sm mb-4">Subscribe for project updates, tips, and offers.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-center sm:text-left">
          &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
