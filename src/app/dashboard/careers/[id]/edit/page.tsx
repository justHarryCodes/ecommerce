import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession, getUserStore } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import type { JobPosting } from "@/types";
import JobPostingForm from "@/components/dashboard/JobPostingForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditJobPostingPage({ params }: Props) {
  const { id } = await params;

  const user = await verifySession();
  if (!user) redirect("/auth/login");

  const store = await getUserStore(user.firebaseUid);
  if (!store) redirect("/onboarding");

  const job = await queryOne<JobPosting>(
    "SELECT * FROM job_postings WHERE id = $1 AND store_id = $2",
    [id, store.id]
  );
  if (!job) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/careers"
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Edit job posting</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate max-w-xs">
            {job.title}
          </p>
        </div>
      </div>

      <JobPostingForm job={job} />
    </div>
  );
}
