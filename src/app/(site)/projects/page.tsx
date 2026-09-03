import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn } from "@/lib/utils";
import { clCard } from "@/lib/cloudinary";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import PageHero from "@/components/storefront/PageHero";
import type { Project, ProjectCategory } from "@/types";

export const metadata = { title: "Projects" };

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "hotels", label: "Hotels" },
  { value: "schools", label: "Schools" },
  { value: "offices", label: "Offices" },
  { value: "restaurants", label: "Restaurants" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const company = await getCompany();

  const params: unknown[] = company ? [company.id] : [];
  let sql = `SELECT * FROM projects WHERE store_id = $1`;
  if (category) {
    sql += ` AND category = $2`;
    params.push(category);
  }
  sql += ` ORDER BY sort_order, created_at DESC`;

  const projects = company ? await query<Project>(sql, params) : [];

  return (
    <div>
      <PageHero
        eyebrow="Our Work"
        title="Completed Projects"
        subtitle="A selection of completed work across residential, commercial, and hospitality spaces."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/projects"
          className="px-4 py-2 rounded-full text-sm font-semibold transition-colors border"
          style={
            !category
              ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
              : { borderColor: "var(--border)", color: "var(--text-secondary)" }
          }
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/projects?category=${c.value}`}
            className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors border")}
            style={
              category === c.value
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            {c.label}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={Building2} title="No projects found" description="Try a different category." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const image = p.images?.[0];
            const categoryLabel = CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              >
                <div className="aspect-[4/3] overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  {image ? (
                    <img
                      src={clCard(image)}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏗️</div>
                  )}
                </div>
                <div className="p-5">
                  <Badge variant="outline">{categoryLabel}</Badge>
                  <h3 className="mt-2.5 text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {p.title}
                  </h3>
                  {p.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <MapPin className="h-3.5 w-3.5" /> {p.location}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
