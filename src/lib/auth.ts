// ─── Auth helpers (server) ────────────────────────────────────────
// Single-company mode: there is exactly one `stores` row (the company
// profile, seeded by migrations/002_company_pivot.sql). Public pages
// read it via getCompany(); dashboard routes resolve the logged-in
// Firebase user to that same row via getUserStore(). There's no more
// public signup (see: deleted /auth/signup), so "has a Firebase
// account in this project" is already the access boundary — accounts
// are created directly in the Firebase console for staff.
import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from './firebase-admin'
import { queryOne, toCamel } from './db'
import type { Store } from '@/types'

const COMPANY_SLUG = process.env.COMPANY_STORE_SLUG ?? 'forge-and-form'

const SESSION_COOKIE = 'session'

export interface SessionUser {
  firebaseUid: string
  email: string
  displayName?: string
}

// Verify session cookie OR Bearer token (mobile app) → returns SessionUser or null
export async function verifySession(): Promise<SessionUser | null> {
  // 1. Try session cookie (web dashboard)
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      return {
        firebaseUid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name,
      };
    }
  } catch {}

  // 2. Try Bearer token (mobile app)
  try {
    const headerStore = await headers();
    const auth = headerStore.get('authorization') ?? headerStore.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
      const idToken = auth.slice(7);
      const decoded = await adminAuth.verifyIdToken(idToken);
      return {
        firebaseUid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name,
      };
    }
  } catch {}

  return null;
}

// Public: fetch the single company profile row. No auth required — used
// by every public marketing/catalog page.
export async function getCompany(): Promise<Store | null> {
  const row = await queryOne(
    'SELECT * FROM stores WHERE slug = $1 AND is_active = true',
    [COMPANY_SLUG]
  )
  if (!row) return null
  return toCamel<Store>(row as Record<string, unknown>)
}

// Dashboard: resolve the logged-in Firebase user to the one company row.
// `firebaseUid` is accepted (unused) to keep the existing call-site
// signature (`getUserStore(user.firebaseUid)`) stable across the app.
export async function getUserStore(firebaseUid: string): Promise<Store | null> {
  void firebaseUid
  return getCompany()
}

// Create session cookie from ID token
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 days
  return adminAuth.createSessionCookie(idToken, { expiresIn })
}

// No-op in single-company mode — there's no per-vendor subscription/setup
// fee anymore. Kept as a pass-through so existing call sites don't need
// to be touched.
export async function requireSubscription(_store: Store): Promise<NextResponse | null> {
  void _store
  return null
}
