import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore, requireSubscription } from '@/lib/auth'
import { cacheDelPattern } from '@/lib/redis'
import { createProduct } from '@/lib/products'
import { ProductInputSchema } from '@/lib/product-schema'
import { z } from 'zod'

// Keep a batch small enough that one request can't hold the DB connection
// (or a browser tab's upload state) hostage — a much bigger catalog import
// is a different feature (CSV + zip), not this one.
const MAX_BATCH = 20

const BulkSchema = z.object({
  products: z.array(z.unknown()).min(1, 'No products to create').max(MAX_BATCH, `Up to ${MAX_BATCH} products per batch`),
})

interface RowResult {
  index: number
  success: boolean
  id?: string
  slug?: string
  error?: string
}

// Deliberately NOT all-or-nothing: each row is validated and inserted
// independently so one bad row (a duplicate name, a bad category id) doesn't
// throw away N-1 good ones. The client gets a per-row result back and can
// retry just the failed rows.
export async function POST(req: NextRequest) {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const store = await getUserStore(user.firebaseUid)
    if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })
    const subErr = await requireSubscription(store)
    if (subErr) return subErr

    const body = await req.json()
    const parsedBatch = BulkSchema.safeParse(body)
    if (!parsedBatch.success) {
      return NextResponse.json({ error: parsedBatch.error.flatten() }, { status: 422 })
    }

    const results: RowResult[] = []

    for (const [index, raw] of parsedBatch.data.products.entries()) {
      const parsed = ProductInputSchema.safeParse(raw)
      if (!parsed.success) {
        const flat = parsed.error.flatten()
        const firstField = Object.values(flat.fieldErrors)[0]?.[0]
        results.push({ index, success: false, error: firstField ?? flat.formErrors[0] ?? 'Invalid product' })
        continue
      }
      try {
        const product = await createProduct(store.id, parsed.data)
        results.push({ index, success: true, id: product.id as string, slug: product.slug as string })
      } catch (err) {
        console.error('[products/bulk] row error:', err)
        results.push({ index, success: false, error: 'Failed to save this product' })
      }
    }

    await cacheDelPattern(`products:${store.id}*`)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[products/bulk] POST error:', err)
    return NextResponse.json({ error: 'Bulk create failed' }, { status: 500 })
  }
}
