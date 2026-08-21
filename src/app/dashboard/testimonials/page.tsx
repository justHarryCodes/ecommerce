import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import TestimonialManager from "@/components/dashboard/TestimonialManager";
import type { Testimonial } from "@/types";

export default async function TestimonialsPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const testimonials = await queryMany<Testimonial>(
    `SELECT * FROM testimonials WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Testimonials</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Customer quotes shown across the site
        </p>
      </div>

      <TestimonialManager testimonials={testimonials} />
    </div>
  );
}
