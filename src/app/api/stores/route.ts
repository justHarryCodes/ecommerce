import { NextResponse } from 'next/server'
import { verifySession, getCompany } from '@/lib/auth'

// Single-company mode: there's exactly one store row (seeded by
// migrations/002_company_pivot.sql). Self-serve store creation
// (the old POST handler) is gone along with vendor signup — the
// company profile is edited via /dashboard/settings instead.
export async function GET() {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await getCompany()
  return NextResponse.json({ data: store })
}
