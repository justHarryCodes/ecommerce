import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, rowsToCamel, toCamel } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'] as const

const Schema = z.object({
  title:          z.string().min(1).max(200),
  department:     z.string().max(100).optional(),
  location:       z.string().max(200).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('full_time'),
  description:    z.string().max(5000).optional(),
  requirements:   z.string().max(5000).optional(),
  isInternship:   z.boolean().default(false),
  isActive:       z.boolean().default(true),
})

export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const rows = await query(
    `SELECT * FROM job_postings WHERE store_id = $1 ORDER BY created_at DESC`,
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
  const exists = await queryOne('SELECT id FROM job_postings WHERE store_id=$1 AND slug=$2', [store.id, slug])
  if (exists) slug = `${slug}-${Date.now()}`

  const rows = await query(`
    INSERT INTO job_postings (
      store_id, title, slug, department, location, employment_type,
      description, requirements, is_internship, is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
  `, [
    store.id, d.title, slug, d.department || null, d.location || null, d.employmentType,
    d.description || null, d.requirements || null, d.isInternship, d.isActive,
  ])

  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
}
