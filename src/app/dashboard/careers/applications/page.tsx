import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import type { JobApplication } from "@/types";
import ApplicationStatusSelect from "@/components/dashboard/ApplicationStatusSelect";
import { formatDateTime } from "@/lib/utils";

export default async function JobApplicationsPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const applications = await queryMany<JobApplication>(
    `SELECT ja.*, jp.title AS job_title
     FROM job_applications ja
     LEFT JOIN job_postings jp ON jp.id = ja.job_posting_id
     WHERE ja.store_id = $1
     ORDER BY ja.created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/careers"
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Applications</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {applications.length} application{applications.length !== 1 ? "s" : ""} received
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-16 text-center">
          <Inbox className="w-12 h-12 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            No applications yet
          </h3>
          <p className="text-sm text-surface-400">
            Applications submitted for your job postings will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 divide-y divide-surface-50 dark:divide-surface-800">
          {applications.map((app) => (
            <div key={app.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-surface-900 dark:text-white">
                  {app.applicant_name ?? app.applicantName}
                </div>
                <div className="text-xs text-surface-400 mt-0.5">
                  Applied for <span className="font-medium">{app.job_title ?? app.jobTitle ?? "—"}</span>
                  {" · "}
                  {formatDateTime(app.created_at ?? app.createdAt ?? "")}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 space-x-3">
                  <span>{app.email}</span>
                  {app.phone && <span>{app.phone}</span>}
                  {(app.resume_url ?? app.resumeUrl) && (
                    <a
                      href={app.resume_url ?? app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 dark:text-accent-400 hover:underline font-medium"
                    >
                      View resume
                    </a>
                  )}
                </div>
                {(app.cover_note ?? app.coverNote) && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-2 max-w-2xl">
                    {app.cover_note ?? app.coverNote}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <ApplicationStatusSelect applicationId={app.id} status={app.status ?? "new"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
