import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore, getCompany, isAdminEmail } from '@/lib/auth'
import { query, queryOne, toCamel, rowsToCamel } from '@/lib/db'
import { generateAffiliateCode } from '@/lib/affiliates'
import { z } from 'zod'

// Admin: list every affiliate + their order/commission stats, for
// /dashboard/affiliates.
export async function GET() {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const store = await getUserStore(user.firebaseUid)
    if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

    const rows = await query(
      `SELECT a.*, COUNT(o.id)::int AS order_count,
         COALESCE(SUM(o.commission_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_commission
       FROM affiliates a
       LEFT JOIN orders o ON o.affiliate_id = a.id
       WHERE a.store_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [store.id]
    )
    return NextResponse.json({ data: rowsToCamel(rows as Record<string, unknown>[]) })
  } catch (err) {
    console.error('[affiliates] GET error:', err)
    return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 })
  }
}

const SelfSignupSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().min(5).max(40).optional(),
})

const AdminCreateSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  phone: z.string().min(5).max(40).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
})

// Two callers share this route:
//  - Any signed-in visitor: self-signup as an affiliate under their own
//    session (POST /api/affiliates with { name, phone }).
//  - An admin: add a partner who hasn't signed up yet (POST /api/affiliates
//    with { name, email, phone, commissionRate }) — no firebase_uid until
//    that person later signs up at /affiliate/signup with the same email,
//    at which point the row is claimed instead of duplicated.
export async function POST(req: NextRequest) {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const company = await getCompany()
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const admin = isAdminEmail(user.email)
    const body = await req.json()

    if (admin) {
      const parsed = AdminCreateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
      const d = parsed.data

      const code = await generateAffiliateCode(company.id, d.name)
      const rows = await query(
        `INSERT INTO affiliates (store_id, name, email, phone, code, commission_rate)
         VALUES ($1,$2,$3,$4,$5,COALESCE($6, 10)) RETURNING *`,
        [company.id, d.name, d.email || null, d.phone || null, code, d.commissionRate ?? null]
      )
      return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
    }

    // Self-signup path
    const parsed = SelfSignupSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const existing = await queryOne(
      'SELECT id FROM affiliates WHERE store_id = $1 AND firebase_uid = $2',
      [company.id, user.firebaseUid]
    )
    if (existing) return NextResponse.json({ error: 'You already have an affiliate account' }, { status: 409 })

    // Claim an admin-added row waiting on this email, if there is one,
    // instead of creating a second row for the same person.
    if (user.email) {
      const unclaimed = await queryOne<{ id: string }>(
        'SELECT id FROM affiliates WHERE store_id = $1 AND firebase_uid IS NULL AND email = $2',
        [company.id, user.email]
      )
      if (unclaimed) {
        const rows = await query(
          `UPDATE affiliates SET firebase_uid = $1, name = $2, phone = COALESCE($3, phone), updated_at = NOW()
           WHERE id = $4 RETURNING *`,
          [user.firebaseUid, d.name, d.phone || null, unclaimed.id]
        )
        return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 200 })
      }
    }

    const code = await generateAffiliateCode(company.id, d.name)
    const rows = await query(
      `INSERT INTO affiliates (store_id, firebase_uid, name, email, phone, code)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [company.id, user.firebaseUid, d.name, user.email || null, d.phone || null, code]
    )
    return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) }, { status: 201 })
  } catch (err) {
    console.error('[affiliates] POST error:', err)
    return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 })
  }
}
