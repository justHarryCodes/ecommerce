import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore, requireSubscription } from '@/lib/auth'
import { query, rowsToCamel } from '@/lib/db'
import { cacheDelPattern } from '@/lib/redis'
import { createProduct } from '@/lib/products'
import { ProductInputSchema } from '@/lib/product-schema'

export async function GET(req: NextRequest) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { searchParams } = req.nextUrl
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50') || 50))
  const search = searchParams.get('search') ?? ''
  const catId  = searchParams.get('categoryId')
  const offset = (page - 1) * limit

  let sql = `SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.store_id = $1`
  const vals: unknown[] = [store.id]
  let idx = 2

  if (search) { sql += ` AND p.name ILIKE $${idx++}`; vals.push(`%${search}%`) }
  if (catId)  { sql += ` AND p.category_id = $${idx++}`; vals.push(catId) }
  sql += ` ORDER BY p.sort_order, p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`
  vals.push(limit, offset)

  const products = await query(sql, vals)
  const [{ count }] = await query('SELECT COUNT(*) FROM products WHERE store_id=$1', [store.id]) as { count: string }[]

  return NextResponse.json({
    data: rowsToCamel(products as Record<string, unknown>[]),
    total: parseInt(count),
    page, limit,
  })
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const store = await getUserStore(user.firebaseUid)
    if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })
    const subErr = await requireSubscription(store)
    if (subErr) return subErr

    const body = await req.json()
    const parsed = ProductInputSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

    const product = await createProduct(store.id, parsed.data)

    await cacheDelPattern(`products:${store.id}*`)
    return NextResponse.json({ data: product }, { status: 201 })
  } catch (err) {
    // Always return JSON here — an uncaught throw (e.g. a DB error) would
    // otherwise surface to the client as an HTML error page, which then
    // fails to parse as JSON with a cryptic "unexpected token" error.
    console.error('[products] POST error:', err)
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 })
  }
}
