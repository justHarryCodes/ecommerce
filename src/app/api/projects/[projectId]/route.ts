import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, toCamel } from '@/lib/db'

type Params = { params: Promise<{ projectId: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { projectId } = await params
  const row = await queryOne('SELECT * FROM projects WHERE id=$1 AND store_id=$2', [projectId, store.id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: toCamel(row as Record<string, unknown>) })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { projectId } = await params
  const body = await req.json()
  const allowed = ['title', 'category', 'location', 'description', 'services_provided',
    'before_images', 'after_images', 'images', 'is_featured', 'sort_order']
  const sets: string[] = []; const vals: unknown[] = []; let i = 1

  for (const [key, val] of Object.entries(body)) {
    const col = key.replace(/([A-Z])/g, c => `_${c.toLowerCase()}`)
    if (allowed.includes(col)) { sets.push(`${col}=$${i++}`); vals.push(val) }
  }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push(`updated_at = NOW()`)
  vals.push(projectId, store.id)

  const rows = await query(
    `UPDATE projects SET ${sets.join(',')} WHERE id=$${i++} AND store_id=$${i} RETURNING *`, vals
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { projectId } = await params
  await query('DELETE FROM projects WHERE id=$1 AND store_id=$2', [projectId, store.id])
  return NextResponse.json({ ok: true })
}
