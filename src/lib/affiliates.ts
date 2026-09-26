import { query, queryOne, toCamel } from './db'
import { getCompany, type SessionUser } from './auth'
import { slugify } from './utils'
import type { Affiliate } from '@/types'

export const AFFILIATE_COOKIE = 'ref'
// Standard affiliate cookie window — an order placed any time in the 30
// days after someone clicks a ?ref= link still credits that affiliate.
export const AFFILIATE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

// Resolves the signed-in Firebase user to their affiliate profile, if
// they have one. Unlike getOrCreateCustomer(), this never auto-creates —
// becoming an affiliate is an explicit signup step (POST /api/affiliates),
// not an implicit side effect of logging in.
export async function getAffiliateBySession(session: SessionUser): Promise<Affiliate | null> {
  const company = await getCompany()
  if (!company) return null

  const row = await queryOne(
    `SELECT a.*, COUNT(o.id)::int AS order_count,
       COALESCE(SUM(o.commission_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_commission
     FROM affiliates a
     LEFT JOIN orders o ON o.affiliate_id = a.id
     WHERE a.store_id = $1 AND a.firebase_uid = $2
     GROUP BY a.id`,
    [company.id, session.firebaseUid]
  )
  return row ? toCamel<Affiliate>(row as Record<string, unknown>) : null
}

// Short, human-shareable code derived from the affiliate's name (e.g.
// "Jane Doe" -> "JANE4821"). Retries with a fresh random suffix on the
// rare collision, same pattern as product/category slug uniqueness.
export async function generateAffiliateCode(storeId: string, name: string): Promise<string> {
  const base = (slugify(name).split('-')[0] || 'PARTNER').toUpperCase().slice(0, 10)
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const code = `${base}${suffix}`
    const exists = await queryOne('SELECT id FROM affiliates WHERE store_id = $1 AND code = $2', [storeId, code])
    if (!exists) return code
  }
  // Astronomically unlikely to be reached — final fallback is guaranteed unique
  return `${base}${Date.now().toString(36).toUpperCase()}`
}

interface ResolvedAffiliate {
  id: string
  code: string
  commissionRate: number
}

// Looks up an active affiliate by code for order attribution. Returns null
// silently for a missing/inactive/unknown code — a bad or stale ?ref= cookie
// should never block checkout, just fail to attribute.
export async function resolveActiveAffiliate(storeId: string, code: string): Promise<ResolvedAffiliate | null> {
  const row = await queryOne<{ id: string; code: string; commission_rate: string }>(
    'SELECT id, code, commission_rate FROM affiliates WHERE store_id = $1 AND code = $2 AND is_active = true',
    [storeId, code]
  )
  return row ? { id: row.id, code: row.code, commissionRate: Number(row.commission_rate) } : null
}

// Commission is computed on the order subtotal only — not delivery fees —
// so an affiliate isn't effectively paid a cut of shipping costs.
export function computeCommission(subtotal: number, commissionRatePercent: number): number {
  return Math.round(subtotal * (commissionRatePercent / 100) * 100) / 100
}
