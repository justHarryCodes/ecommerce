import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, toCamel } from '@/lib/db'
import { z } from 'zod'

const Schema = z.object({
  status:    z.enum(['new', 'contacted', 'quoted', 'won', 'lost']).optional(),
  adminNote: z.string().max(5000).nullable().optional(),
})

type Params = { params: Promise<{ id: string }> }

// PATCH only (status / admin_note). No public POST here — the lead-capture
// submission endpoint lives on the sibling collection route and is owned
// by a parallel agent.
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const sets: string[] = []; const vals: unknown[] = []; let i = 1
  if (parsed.data.status !== undefined) { sets.push(`status=$${i++}`); vals.push(parsed.data.status) }
  if (parsed.data.adminNote !== undefined) { sets.push(`admin_note=$${i++}`); vals.push(parsed.data.adminNote) }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push(`updated_at = NOW()`)
  vals.push(id, store.id)

  const rows = await query(
    `UPDATE quote_requests SET ${sets.join(',')} WHERE id=$${i++} AND store_id=$${i} RETURNING *`, vals
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) })
}
