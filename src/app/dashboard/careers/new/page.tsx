import JobPostingForm from "@/components/dashboard/JobPostingForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewJobPostingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/careers"
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Add job posting
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Post a new open role or internship
          </p>
        </div>
      </div>

      <JobPostingForm />
    </div>
  );
}
