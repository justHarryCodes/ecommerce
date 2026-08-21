import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, rowsToCamel, toCamel } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const CATEGORIES = ['residential', 'commercial', 'hotels', 'schools', 'offices', 'restaurants'] as const

const Schema = z.object({
  title:             z.string().min(1).max(200),
  category:          z.enum(CATEGORIES).default('residential'),
  location:          z.string().max(200).optional(),
  description:       z.string().max(5000).optional(),
  servicesProvided:  z.array(z.string()).default([]),
  beforeImages:      z.array(z.string()).default([]),
  afterImages:       z.array(z.string()).default([]),
  images:            z.array(z.string()).default([]),
  isFeatured:        z.boolean().default(false),
  sortOrder:         z.number().int().default(0),
})

export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const rows = await query(
    `SELECT * FROM projects WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
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
  let slug = slugify(d.title)
  const exists = await queryOne('SELECT id FROM projects WHERE store_id=$1 AND slug=$2', [store.id, slug])
  if (exists) slug = `${slug}-${Date.now()}`

  const rows = await query(`
    INSERT INTO projects (
      store_id, title, slug, category, location, description, services_provided,
      before_images, after_images, images, is_featured, sort_order
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
  `, [
    store.id, d.title, slug, d.category, d.location || null, d.description || null,
    d.servicesProvided, d.beforeImages, d.afterImages, d.images, d.isFeatured, d.sortOrder,
  ])

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
}
