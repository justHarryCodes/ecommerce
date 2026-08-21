import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { waLink } from "@/lib/utils";
import ContactForm from "@/components/storefront/ContactForm";

export const metadata = { title: "Contact Us" };

function formatHoursLabel(key: string): string {
  const map: Record<string, string> = {
    mon_fri: "Mon – Fri",
    sat: "Saturday",
    sun: "Sunday",
  };
  return map[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ContactPage() {
  const company = await getCompany();
  const phone = company?.phone;
  const email = company?.email;
  const address = company?.address;
  const whatsapp = company?.whatsapp;
  const businessHours = company?.businessHours ?? company?.business_hours;
  const mapEmbedUrl = company?.mapEmbedUrl ?? company?.map_embed_url;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          Get in Touch
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Have a project in mind? Send us a message and our team will get back to you shortly.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="space-y-5 mb-10">
            {phone && (
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--accent-light)" }}>
                  <Phone className="h-5 w-5" style={{ color: "var(--accent-dark)" }} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Phone</p>
                  <a href={`tel:${phone}`} className="text-sm font-medium hover:opacity-70" style={{ color: "var(--text-primary)" }}>{phone}</a>
                </div>
              </div>
            )}
            {email && (
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--accent-light)" }}>
                  <Mail className="h-5 w-5" style={{ color: "var(--accent-dark)" }} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Email</p>
                  <a href={`mailto:${email}`} className="text-sm font-medium hover:opacity-70 break-all" style={{ color: "var(--text-primary)" }}>{email}</a>
                </div>
              </div>
            )}
            {address && (
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--accent-light)" }}>
                  <MapPin className="h-5 w-5" style={{ color: "var(--accent-dark)" }} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Address</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{address}</p>
                </div>
              </div>
            )}
            {businessHours && Object.keys(businessHours).length > 0 && (
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--accent-light)" }}>
                  <Clock className="h-5 w-5" style={{ color: "var(--accent-dark)" }} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Business Hours</p>
                  <ul className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {Object.entries(businessHours).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{formatHoursLabel(key)}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {whatsapp && (
              <a
                href={waLink(whatsapp, "Hi, I'd like to know more about your services.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "#25D366" }}
              >
                Chat on WhatsApp
              </a>
            )}
          </div>

          {mapEmbedUrl && (
            <div className="rounded-2xl overflow-hidden border aspect-video" style={{ borderColor: "var(--border)" }}>
              <iframe
                src={mapEmbedUrl}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location map"
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-primary)" }}>Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
