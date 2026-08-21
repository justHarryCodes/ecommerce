import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, toCamel } from '@/lib/db'
import { z } from 'zod'

const Schema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'rejected', 'hired']),
})

type Params = { params: Promise<{ id: string }> }

// PATCH only (status). No public POST here — that belongs to a parallel
// agent's public application-submission endpoint on a different path.
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const rows = await query(
    `UPDATE job_applications SET status=$1 WHERE id=$2 AND store_id=$3 RETURNING *`,
    [parsed.data.status, id, store.id]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) })
}
