import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import GalleryGrid from "@/components/storefront/GalleryGrid";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          Gallery
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          A closer look at our work — metalwork, aluminium & glass, woodworking, decorative concrete, and interiors.
        </p>
      </div>

      <GalleryGrid items={items} />
    </div>
  );
}
