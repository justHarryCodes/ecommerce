import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, rowsToCamel, toCamel } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const Schema = z.object({
  title:       z.string().min(1).max(200),
  excerpt:     z.string().max(500).optional(),
  content:     z.string().default(''),
  coverImage:  z.string().optional(),
  category:    z.string().max(100).optional(),
  author:      z.string().max(100).optional(),
  isPublished: z.boolean().default(false),
})

export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const rows = await query(
    `SELECT * FROM blog_posts WHERE store_id = $1 ORDER BY created_at DESC`,
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
  const exists = await queryOne('SELECT id FROM blog_posts WHERE store_id=$1 AND slug=$2', [store.id, slug])
  if (exists) slug = `${slug}-${Date.now()}`

  const rows = await query(`
    INSERT INTO blog_posts (
      store_id, title, slug, excerpt, content, cover_image, category, author, is_published, published_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
  `, [
    store.id, d.title, slug, d.excerpt || null, d.content, d.coverImage || null,
    d.category || null, d.author || null, d.isPublished, d.isPublished ? new Date() : null,
  ])

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
}
