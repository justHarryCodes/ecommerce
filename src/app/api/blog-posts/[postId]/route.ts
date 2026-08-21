import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUserStore } from '@/lib/auth'
import { query, queryOne, toCamel } from '@/lib/db'

type Params = { params: Promise<{ postId: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { postId } = await params
  const row = await queryOne('SELECT * FROM blog_posts WHERE id=$1 AND store_id=$2', [postId, store.id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: toCamel(row as Record<string, unknown>) })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { postId } = await params
  const existing = await queryOne<{ is_published: boolean; published_at: string | null }>(
    'SELECT is_published, published_at FROM blog_posts WHERE id=$1 AND store_id=$2',
    [postId, store.id]
  )
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const allowed = ['title', 'excerpt', 'content', 'cover_image', 'category', 'author', 'is_published']
  const sets: string[] = []; const vals: unknown[] = []; let i = 1

  for (const [key, val] of Object.entries(body)) {
    const col = key.replace(/([A-Z])/g, c => `_${c.toLowerCase()}`)
    if (allowed.includes(col)) { sets.push(`${col}=$${i++}`); vals.push(val) }
  }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  // First time a post is published, stamp published_at. Un-publishing leaves
  // the original published_at intact so re-publishing doesn't bump the date.
  if (body.isPublished === true && !existing.is_published && !existing.published_at) {
    sets.push(`published_at = NOW()`)
  }
  sets.push(`updated_at = NOW()`)
  vals.push(postId, store.id)

  const rows = await query(
    `UPDATE blog_posts SET ${sets.join(',')} WHERE id=$${i++} AND store_id=$${i} RETURNING *`, vals
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: toCamel(rows[0] as Record<string, unknown>) })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const user = await verifySession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await getUserStore(user.firebaseUid)
  if (!store) return NextResponse.json({ error: 'No store' }, { status: 404 })

  const { postId } = await params
  await query('DELETE FROM blog_posts WHERE id=$1 AND store_id=$2', [postId, store.id])
  return NextResponse.json({ ok: true })
}
