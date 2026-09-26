import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, toCamel } from '@/lib/db'
import { z } from 'zod'

type Params = { params: Promise<{ affiliateId: string }> }

const Schema = z.object({
  commissionRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(200).optional(),
  phone: z.string().max(40).optional(),
  // An amount to add to total_paid (e.g. "I just paid them ₦20,000") —
  // additive so the admin never has to compute the new running total by hand.
  addPayout: z.number().min(0).optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const store = await getUserStore(user.firebaseUid)
    if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

    const { affiliateId } = await params
    const existing = await queryOne('SELECT id FROM affiliates WHERE id = $1 AND store_id = $2', [affiliateId, store.id])
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const sets: string[] = []
    const vals: unknown[] = []
    let i = 1
    if (d.commissionRate != null) { sets.push(`commission_rate = $${i++}`); vals.push(d.commissionRate) }
    if (d.isActive != null) { sets.push(`is_active = $${i++}`); vals.push(d.isActive) }
    if (d.name != null) { sets.push(`name = $${i++}`); vals.push(d.name) }
    if (d.phone != null) { sets.push(`phone = $${i++}`); vals.push(d.phone) }
    if (d.addPayout != null) { sets.push(`total_paid = total_paid + $${i++}`); vals.push(d.addPayout) }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push('updated_at = NOW()')
    vals.push(affiliateId, store.id)

    const rows = await query(
      `UPDATE affiliates SET ${sets.join(', ')} WHERE id = $${i++} AND store_id = $${i} RETURNING *`,
      vals
    )
    return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) })
  } catch (err) {
    console.error('[affiliates/:id] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const store = await getUserStore(user.firebaseUid)
    if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

    const { affiliateId } = await params
    await query('DELETE FROM affiliates WHERE id = $1 AND store_id = $2', [affiliateId, store.id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[affiliates/:id] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete affiliate' }, { status: 500 })
  }
}
