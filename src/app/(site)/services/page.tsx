import Link from "next/link";
import { Wrench } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { EmptyState } from "@/components/ui/EmptyState";
import PageHero from "@/components/storefront/PageHero";
import type { Service } from "@/types";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const company = await getCompany();
  const services = company
    ? await query<Service>(
        `SELECT * FROM services WHERE store_id = $1 AND is_active = true ORDER BY sort_order, name`,
        [company.id]
      )
    : [];

  return (
    <div>
      <PageHero
        eyebrow="What We Do"
        title="Our Services"
        subtitle="From metal fabrication to complete interior fit-outs — everything under one roof, from consultation to installation."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services listed yet" description="Please check back shortly." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.slug}`}
              className="group flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4"
                style={{ background: "var(--accent-light)" }}
              >
                {s.icon ?? "🛠️"}
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {s.name}
              </h3>
              {(s.short_description ?? s.shortDescription) && (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {s.short_description ?? s.shortDescription}
                </p>
              )}
              <span
                className="mt-4 text-sm font-semibold transition-opacity opacity-80 group-hover:opacity-100"
                style={{ color: "var(--accent)" }}
              >
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
