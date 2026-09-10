import { NextRequest, NextResponse } from "next/server";

// Single-company site — no subdomain/store-slug rewriting needed. This just
// gives /dashboard a fast, edge-level redirect for unauthenticated visitors
// as defense-in-depth alongside dashboard/layout.tsx's own server-side check.

function isAuthenticated(req: NextRequest): boolean {
  return !!req.cookies.get("session")?.value;
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const url = new URL("/auth/login", req.url);
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !isAuthenticated(req)) {
    return redirectToLogin(req, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
