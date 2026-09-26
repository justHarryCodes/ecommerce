import { NextResponse } from "next/server";
import { verifySession, isAdminEmail } from "@/lib/auth";
import { getAffiliateBySession } from "@/lib/affiliates";

// Lightweight "who am I" for the header account menu. Never gates anything —
// returns { viewer: null } for anonymous visitors so public pages stay
// public (and static); it just tells the client whether to show the
// account menu, whether to include the admin Dashboard link, and whether to
// include the affiliate dashboard link.
export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ viewer: null });

  const isAdmin = isAdminEmail(session.email);
  const affiliate = isAdmin ? null : await getAffiliateBySession(session);

  return NextResponse.json({
    viewer: {
      name: session.displayName || session.email.split("@")[0] || "Account",
      email: session.email,
      isAdmin,
      isAffiliate: !!affiliate,
    },
  });
}
