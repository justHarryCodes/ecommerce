// Shared image source for hero collage backgrounds (home page + PageHero).
// Prefers curated gallery photos; falls back to project/product photos so
// the collage never looks broken on a freshly-seeded site.
import { getCompany } from "./auth";
import { query } from "./db";

export async function getHeroCollageImages(limit = 6): Promise<string[]> {
  const company = await getCompany();
  if (!company) return [];

  const gallery = await query<{ media_url: string }>(
    `SELECT media_url FROM gallery_items WHERE store_id = $1 AND media_type = 'image' ORDER BY sort_order, created_at DESC LIMIT $2`,
    [company.id, limit]
  );
  if (gallery.length >= 3) return gallery.map((g) => g.media_url);

  const projectRows = await query<{ images: string[] }>(
    `SELECT images FROM projects WHERE store_id = $1 AND images IS NOT NULL AND array_length(images, 1) > 0 ORDER BY sort_order LIMIT $2`,
    [company.id, limit]
  );
  const projectImages = projectRows.flatMap((p) => p.images ?? []).slice(0, limit);
  if (projectImages.length >= 3) return projectImages;

  const productRows = await query<{ image_url: string | null; images: string[] | null }>(
    `SELECT image_url, images FROM products WHERE store_id = $1 AND is_active = true ORDER BY sort_order LIMIT $2`,
    [company.id, limit]
  );
  return productRows
    .flatMap((p) => (p.images?.length ? p.images : p.image_url ? [p.image_url] : []))
    .slice(0, limit);
}
