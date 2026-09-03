import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import GalleryGrid from "@/components/storefront/GalleryGrid";
import PageHero from "@/components/storefront/PageHero";
import type { GalleryItem } from "@/types";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const company = await getCompany();
  const items = company
    ? await query<GalleryItem>(
        `SELECT * FROM gallery_items WHERE store_id = $1 ORDER BY sort_order, created_at DESC`,
        [company.id]
      )
    : [];

  return (
    <div>
      <PageHero
        eyebrow="Gallery"
        title="Photos & Videos"
        subtitle="A closer look at our work — metalwork, aluminium & glass, woodworking, decorative concrete, and interiors."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <GalleryGrid items={items} />
      </div>
    </div>
  );
}
