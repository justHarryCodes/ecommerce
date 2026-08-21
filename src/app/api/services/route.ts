import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, rowsToCamel, toCamel } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const Schema = z.object({
  name:              z.string().min(1).max(200),
  shortDescription:  z.string().max(300).optional(),
  description:       z.string().max(5000).optional(),
  icon:              z.string().max(20).optional(),
  imageUrl:          z.string().optional(),
  benefits:          z.array(z.string()).default([]),
  relatedProductIds: z.array(z.string().uuid()).default([]),
  isActive:          z.boolean().default(true),
  sortOrder:         z.number().int().default(0),
})

export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const rows = await query(
    `SELECT * FROM services WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
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
  let slug = slugify(d.name)
  const exists = await queryOne('SELECT id FROM services WHERE store_id=$1 AND slug=$2', [store.id, slug])
  if (exists) slug = `${slug}-${Date.now()}`

  const rows = await query(`
    INSERT INTO services (
      store_id, name, slug, short_description, description, icon, image_url,
      benefits, related_product_ids, is_active, sort_order
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
  `, [
    store.id, d.name, slug, d.shortDescription || null, d.description || null,
    d.icon || null, d.imageUrl || null, d.benefits, d.relatedProductIds,
    d.isActive, d.sortOrder,
  ])

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
}
