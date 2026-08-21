import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import Link from "next/link";
import { Plus, UserPlus, Pencil, Inbox } from "lucide-react";
import DeleteEntityButton from "@/components/dashboard/DeleteEntityButton";
import type { JobPosting } from "@/types";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export default async function CareersPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const postings = await queryMany<JobPosting>(
    `SELECT * FROM job_postings WHERE store_id = $1 ORDER BY created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Careers</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {postings.length} job posting{postings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/careers/applications"
            className="flex items-center gap-2 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-surface-50 dark:hover:bg-surface-800"
          >
            <Inbox className="w-4 h-4" />
            Applications
          </Link>
          <Link
            href="/dashboard/careers/new"
            className="flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add job posting
          </Link>
        </div>
      </div>

      {postings.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-16 text-center">
          <UserPlus className="w-12 h-12 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            No job postings yet
          </h3>
          <p className="text-sm text-surface-400 mb-6">
            Post open roles and internships for candidates to apply to.
          </p>
          <Link
            href="/dashboard/careers/new"
            className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add first job posting
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 divide-y divide-surface-50 dark:divide-surface-800">
          {postings.map((job) => (
            <div key={job.id} className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-surface-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                  {job.title}
                </div>
                <div className="text-xs text-surface-400 truncate">
                  {EMPLOYMENT_LABELS[job.employment_type ?? job.employmentType ?? "full_time"]}
                  {job.department ? ` · ${job.department}` : ""}
                  {job.location ? ` · ${job.location}` : ""}
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
                  job.is_active
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                }`}
              >
                {job.is_active ? "Open" : "Closed"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/careers/${job.id}/edit`}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                <DeleteEntityButton apiPath={`/api/job-postings/${job.id}`} label="Job posting" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
