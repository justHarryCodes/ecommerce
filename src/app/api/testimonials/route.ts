import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, rowsToCamel, toCamel } from '@/lib/db'
import { z } from 'zod'

const Schema = z.object({
  customerName:  z.string().min(1).max(200),
  customerTitle: z.string().max(200).optional(),
  quote:         z.string().min(1).max(2000),
  rating:        z.number().int().min(1).max(5).optional(),
  photoUrl:      z.string().optional(),
  isFeatured:    z.boolean().default(false),
  sortOrder:     z.number().int().default(0),
})

export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const rows = await query(
    `SELECT * FROM testimonials WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
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
    INSERT INTO testimonials (store_id, customer_name, customer_title, quote, rating, photo_url, is_featured, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, [store.id, d.customerName, d.customerTitle || null, d.quote, d.rating || null, d.photoUrl || null, d.isFeatured, d.sortOrder])

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
}
