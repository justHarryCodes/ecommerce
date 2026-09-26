import { NextResponse } from "next/server";
import { verifySession, isAdminEmail } from "@/lib/auth";
import { getAffiliateBySession } from "@/lib/affiliates";

// Called right after any login (staff /auth/login and customer/affiliate
// /account/login + /account/signup + /affiliate/signup) to decide where to
// send the user: admins (ADMIN_EMAILS) land on the dashboard, affiliates on
// their affiliate dashboard, everyone else on their customer account
// section. A person can be both a customer and an affiliate under the same
// login — affiliate takes priority here since signing up for it is the more
// deliberate, recent action; the customer section is always still one click
// away from the header.
export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ url: "/account/login" });

  if (isAdminEmail(user.email)) return NextResponse.json({ url: "/dashboard" });

  const affiliate = await getAffiliateBySession(user);
  if (affiliate) return NextResponse.json({ url: "/affiliate" });

  return NextResponse.json({ url: "/account" });
}
