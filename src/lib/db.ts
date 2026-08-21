// ─── PostgreSQL connection pool ──────────────────────────────────
import { Pool, PoolClient } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.')
}

declare global {
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Set DATABASE_SSL=true in env if your Postgres host requires SSL (e.g. Neon, Supabase)
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30_000,
    // 2s was too tight against a remote (non-localhost) Postgres host —
    // `next build`'s static generation spins up several parallel worker
    // processes, each opening its own pool of up to `max` connections, and
    // the resulting connection burst plus real network latency occasionally
    // pushed past 2s, aborting the build with "Connection terminated due to
    // connection timeout" on an essentially-arbitrary page. 10s gives normal
    // connections plenty of headroom while still failing fast on a truly
    // unreachable host.
    connectionTimeoutMillis: 10_000,
  })
}

export const pool: Pool =
  process.env.NODE_ENV === 'development'
    ? (global._pgPool ??= createPool())
    : createPool()

// ─── Query helpers ────────────────────────────────────────────────
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now()
  const res = await pool.query(text, params)
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB]', { query: text.slice(0, 80), ms: Date.now() - start, rows: res.rowCount })
  }
  return res.rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Row-to-camelCase mapper ──────────────────────────────────────
export function toCamel<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v,
    ])
  ) as T
}

export function rowsToCamel<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map(r => toCamel<T>(r))
}

export const queryMany = query
