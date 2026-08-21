import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { clMedium } from "@/lib/cloudinary";
import { Badge } from "@/components/ui/Badge";
import type { Project, ProjectCategory } from "@/types";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  hotels: "Hotels",
  schools: "Schools",
  offices: "Offices",
  restaurants: "Restaurants",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany();
  if (!company) return {};
  const project = await queryOne<Project>(`SELECT * FROM projects WHERE store_id = $1 AND slug = $2`, [company.id, slug]);
  return { title: project?.title ?? "Project" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany();
  if (!company) notFound();

  const project = await queryOne<Project>(`SELECT * FROM projects WHERE store_id = $1 AND slug = $2`, [company.id, slug]);
  if (!project) notFound();

  const beforeImages = project.before_images ?? project.beforeImages ?? [];
  const afterImages = project.after_images ?? project.afterImages ?? [];
  const images = project.images ?? [];
  const servicesProvided = project.services_provided ?? project.servicesProvided ?? [];
  const hasBeforeAfter = beforeImages.length > 0 && afterImages.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-1.5 text-sm mb-8 flex-wrap" style={{ color: "var(--text-secondary)" }}>
        <Link href="/projects" className="hover:opacity-70">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span style={{ color: "var(--text-primary)" }}>{project.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Badge variant="outline">{CATEGORY_LABELS[project.category] ?? project.category}</Badge>
        {project.location && (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <MapPin className="h-4 w-4" /> {project.location}
          </span>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-black mb-6" style={{ color: "var(--text-primary)" }}>
        {project.title}
      </h1>

      {/* Gallery */}
      {hasBeforeAfter ? (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Before</p>
            <div className="space-y-2">
              {beforeImages.map((img, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  <img src={clMedium(img)} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>After</p>
            <div className="space-y-2">
              {afterImages.map((img, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  <img src={clMedium(img)} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : images.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {images.map((img, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
              <img src={clMedium(img)} alt={`${project.title} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      {project.description && (
        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
          {project.description}
        </p>
      )}

      {servicesProvided.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
            Services provided
          </p>
          <div className="flex flex-wrap gap-2">
            {servicesProvided.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
