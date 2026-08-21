import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import Link from "next/link";
import { Plus, Building2, Pencil } from "lucide-react";
import DeleteEntityButton from "@/components/dashboard/DeleteEntityButton";
import type { Project } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  hotels: "Hotels",
  schools: "Schools",
  offices: "Offices",
  restaurants: "Restaurants",
};

export default async function ProjectsPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const projects = await queryMany<Project>(
    `SELECT * FROM projects WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Projects</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in the portfolio
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-16 text-center">
          <Building2 className="w-12 h-12 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-surface-400 mb-6">
            Showcase completed work in your portfolio.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add first project
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 divide-y divide-surface-50 dark:divide-surface-800">
          {projects.map((project) => {
            const cover = project.images?.[0];
            return (
              <div key={project.id} className="p-4 flex items-center gap-3">
                {cover ? (
                  <img
                    src={cover}
                    alt={project.title}
                    className="w-12 h-12 rounded-xl object-cover border border-surface-100 dark:border-surface-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-surface-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                    {project.title}
                  </div>
                  <div className="text-xs text-surface-400 truncate">
                    {CATEGORY_LABELS[project.category] ?? project.category}
                    {project.location ? ` · ${project.location}` : ""}
                  </div>
                </div>
                {project.is_featured && (
                  <span className="shrink-0 inline-flex items-center text-xs px-2 py-1 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    Featured
                  </span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/dashboard/projects/${project.id}/edit`}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                  <DeleteEntityButton apiPath={`/api/projects/${project.id}`} label="Project" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
