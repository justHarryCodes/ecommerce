import { query, queryOne, toCamel } from './db'
import { ensureUncategorized } from './categories'
import { slugify } from './utils'
import type { ProductInput } from './product-schema'

// Shared insert path for both /api/products (single) and /api/products/bulk
// (many) — one source of truth for slug uniqueness + the Uncategorized
// fallback + the INSERT column list, so they can't quietly diverge.
export async function createProduct(storeId: string, d: ProductInput): Promise<Record<string, unknown>> {
  let slug = slugify(d.name)
  const exists = await queryOne('SELECT id FROM products WHERE store_id=$1 AND slug=$2', [storeId, slug])
  if (exists) slug = `${slug}-${Date.now()}`

  const imageUrl = d.imageUrl || d.images[0] || null

  // Fall back to Uncategorized when no category is provided
  const categoryId = d.categoryId || await ensureUncategorized(storeId)

  const rows = await query(`
    INSERT INTO products (
      store_id, category_id, subcategory_id, name, slug, description, short_description,
      price, price_note, compare_price, delivery_fee_within_state, delivery_fee_interstate, delivery_timeline,
      stock_quantity, image_url, images, is_active, is_featured, is_top_selling, is_sponsored,
      is_purchasable, size_options, material_options, color_options
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *
  `, [
    storeId, categoryId, d.subcategoryId || null, d.name, slug,
    d.description || null, d.shortDescription || null, d.price ?? null, d.priceNote || null, d.comparePrice || null,
    d.deliveryFeeWithinState, d.deliveryFeeInterstate, d.deliveryTimeline || null,
    d.stockQuantity, imageUrl, d.images, d.isActive, d.isFeatured, d.isTopSelling, d.isSponsored,
    d.isPurchasable, d.sizeOptions, d.materialOptions, d.colorOptions
  ])

  return toCamel<Record<string, unknown>>(rows[0] as Record<string, unknown>)
}
