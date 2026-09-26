import { z } from 'zod'

// Single source of truth for what a valid product looks like server-side —
// used by both the single-product create route (/api/products) and the
// bulk-create route (/api/products/bulk), so the two can never drift the
// way the old duplicate product-edit form once did.
export const ProductInputSchema = z.object({
  name:             z.string().min(1).max(200),
  description:      z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  // basePrice is what the admin actually enters (her cost) — price and
  // comparePrice are derived from it server-side (src/lib/pricing.ts) and
  // never trusted from the client. Both are still accepted here so a
  // product can be created/edited without a basePrice at all (e.g. an
  // older product, or a quote-only item using priceNote instead).
  basePrice:        z.number().min(0).optional(),
  price:            z.number().min(0).optional(),
  priceNote:        z.string().max(100).optional(),
  comparePrice:     z.number().min(0).optional(),
  freeDelivery:     z.boolean().default(false),
  deliveryFeeWithinState: z.number().min(0).default(0),
  deliveryFeeInterstate:  z.number().min(0).default(0),
  deliveryTimeline:       z.string().max(120).optional(),
  stockQuantity:    z.number().int().min(0).default(0),
  categoryId:       z.string().uuid().optional(),
  subcategoryId:    z.string().uuid().optional(),
  images:           z.array(z.string()).max(3, 'Up to 3 images allowed').default([]),
  imageUrl:         z.string().optional(),
  isActive:         z.boolean().default(true),
  isFeatured:       z.boolean().default(false),
  isTopSelling:     z.boolean().default(false),
  isSponsored:      z.boolean().default(false),
  // Defaults to true — this catalog sells real, in-stock items; quote-only
  // is the deliberate exception (custom/made-to-order work), not the norm.
  isPurchasable:    z.boolean().default(true),
  sizeOptions:      z.array(z.string()).default([]),
  materialOptions:  z.array(z.string()).default([]),
  colorOptions:     z.array(z.string()).default([]),
})

export type ProductInput = z.infer<typeof ProductInputSchema>
