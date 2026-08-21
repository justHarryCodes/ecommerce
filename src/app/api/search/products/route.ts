import { NextRequest, NextResponse } from "next/server";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Product } from "@/types";

// Public product search — powers the header search box (live dropdown)
// and /products?search=. Backed by the pg_trgm GIN indexes added in
// migrations/005_product_search.sql: the ILIKE clauses use the index for
// the substring match, similarity() ranks the already-filtered rows.
export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, {
    key: "rl:search",
    max: 60,
    window: 60,
    message: "Too many search requests. Please slow down.",
  });
  if (limited) return limited;

  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const limit = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "8") || 8));

  if (!q) return NextResponse.json({ data: [] });

  const company = await getCompany();
  if (!company) return NextResponse.json({ data: [] });

  const like = `%${q}%`;
  const results = await query<Product>(
    `SELECT id, name, slug, image_url, images, price, price_note, is_purchasable
     FROM products
     WHERE store_id = $1 AND is_active = true
       AND (name ILIKE $2 OR short_description ILIKE $2)
     ORDER BY similarity(name, $3) DESC, name ASC
     LIMIT $4`,
    [company.id, like, q, limit]
  );

  return NextResponse.json({ data: results });
}
