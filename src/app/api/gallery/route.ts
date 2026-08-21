import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, rowsToCamel, toCamel } from '@/lib/db'
import { z } from 'zod'

const FILTER_CATEGORIES = ['metal', 'aluminum_glass', 'wood', 'decorative_concrete', 'interior', 'exterior'] as const

const Schema = z.object({
  title:          z.string().max(200).optional(),
  mediaType:      z.enum(['image', 'video']).default('image'),
  mediaUrl:       z.string().min(1, 'Media URL is required'),
  thumbnailUrl:   z.string().optional(),
  filterCategory: z.enum(FILTER_CATEGORIES).default('metal'),
  sortOrder:      z.number().int().default(0),
})

export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const rows = await query(
    `SELECT * FROM gallery_items WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
    [store.id]
  )
  return NextResponse.json({ data: rowsToCamel(rows as Record<string, unknown>[]) })
}

export async function POST(req: NextRequest) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const d = parsed.data
  const rows = await query(`
    INSERT INTO gallery_items (store_id, title, media_type, media_url, thumbnail_url, filter_category, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [store.id, d.title || null, d.mediaType, d.mediaUrl, d.thumbnailUrl || null, d.filterCategory, d.sortOrder])

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
}
