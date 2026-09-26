import { NextRequest, NextResponse } from "next/server";

// Single-company site — no subdomain/store-slug rewriting needed. This just
// gives /dashboard a fast, edge-level redirect for unauthenticated visitors
// as defense-in-depth alongside dashboard/layout.tsx's own server-side check,
// and captures affiliate ?ref= links into a cookie for checkout attribution.

const AFFILIATE_COOKIE = "ref";
const AFFILIATE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function isAuthenticated(req: NextRequest): boolean {
  return !!req.cookies.get("session")?.value;
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const url = new URL("/auth/login", req.url);
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !isAuthenticated(req)) {
    return redirectToLogin(req, pathname);
  }

  const res = NextResponse.next();

  // Whoever clicks a ?ref=CODE link gets it remembered for 30 days — the
  // code isn't validated here (that would mean a DB lookup on every single
  // page view); an unknown/inactive code is simply ignored later, at order
  // creation time. Never overwrite an existing cookie with a blank/missing
  // ref on subsequent navigation.
  const ref = searchParams.get("ref");
  if (ref && /^[A-Za-z0-9_-]{3,40}$/.test(ref)) {
    res.cookies.set(AFFILIATE_COOKIE, ref, {
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
