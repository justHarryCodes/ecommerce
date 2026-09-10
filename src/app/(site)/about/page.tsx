import { getCompany } from "@/lib/auth";
import { WHY_CHOOSE_US } from "@/lib/site-content";
import QuoteRequestButton from "@/components/storefront/QuoteRequestButton";
import PageHero from "@/components/storefront/PageHero";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const company = await getCompany();
  const companyName = company?.name ?? "Build&Funish";

  return (
    <div>
      <PageHero
        eyebrow="About Us"
        title={`The team behind ${companyName}`}
        subtitle={
          company?.description ??
          "Integrated fabrication and interior solutions — metalwork, aluminium & glass, woodworking, decorative concrete, and complete interior fit-outs."
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {(company?.vision || company?.mission) && (
        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          {company?.vision && (
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>
                Our Vision
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {company.vision}
              </p>
            </div>
          )}
          {company?.mission && (
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>
                Our Mission
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {company.mission}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-black mb-6" style={{ color: "var(--text-primary)" }}>
          Why Choose Us
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {WHY_CHOOSE_US.map(({ title, icon: Icon }) => (
            <div key={title} className="flex flex-col items-start gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-light)" }}>
                <Icon className="h-5 w-5" style={{ color: "var(--accent-dark)" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl p-8" style={{ background: "var(--bg-secondary)" }}>
        <div className="flex-1">
          <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Ready to start your project?</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Tell us what you need — we'll get back to you with a quote.</p>
        </div>
        <QuoteRequestButton sourceType="general" size="lg" />
      </div>
      </div>
    </div>
  );
}
