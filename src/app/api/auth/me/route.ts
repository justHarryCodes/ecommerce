import { NextResponse } from "next/server";
import { verifySession, isAdminEmail } from "@/lib/auth";

// Lightweight "who am I" for the header account menu. Never gates anything —
// returns { viewer: null } for anonymous visitors so public pages stay
// public (and static); it just tells the client whether to show the
// account menu and whether to include the admin Dashboard link.
export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ viewer: null });

  return NextResponse.json({
    viewer: {
      name: session.displayName || session.email.split("@")[0] || "Account",
      email: session.email,
      isAdmin: isAdminEmail(session.email),
    },
  });
}
