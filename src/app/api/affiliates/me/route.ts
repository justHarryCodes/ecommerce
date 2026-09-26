import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAffiliateBySession } from '@/lib/affiliates'
import { query } from '@/lib/db'

// The signed-in affiliate's own profile + stats + recent attributed orders,
// for their /affiliate dashboard. Deliberately excludes customer PII — an
// affiliate sees which of their referrals converted and what they earned,
// never who the buyer was or where the order is being delivered.
export async function GET() {
  try {
    const user = await verifySession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const affiliate = await getAffiliateBySession(user)
    if (!affiliate) return NextResponse.json({ affiliate: null })

    const orders = await query(
      `SELECT order_number, created_at, order_status, payment_status, subtotal, commission_amount
       FROM orders WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [affiliate.id]
    )

    return NextResponse.json({ affiliate, orders })
  } catch (err) {
    console.error('[affiliates/me] GET error:', err)
    return NextResponse.json({ error: 'Failed to load affiliate profile' }, { status: 500 })
  }
}
