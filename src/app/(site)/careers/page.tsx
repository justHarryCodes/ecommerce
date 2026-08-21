import { Users } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { EmptyState } from "@/components/ui/EmptyState";
import JobPostingCard from "@/components/storefront/JobPostingCard";
import type { JobPosting } from "@/types";

export const metadata = { title: "Careers" };

export default async function CareersPage() {
  const company = await getCompany();
  const jobs = company
    ? await query<JobPosting>(
        `SELECT * FROM job_postings WHERE store_id = $1 AND is_active = true ORDER BY created_at DESC`,
        [company.id]
      )
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          Careers
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Join our team — see our open roles below and apply directly.
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Users} title="No open roles right now" description="Check back soon — we're always growing." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobPostingCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
