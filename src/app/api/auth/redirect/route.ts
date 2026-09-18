import { NextResponse } from "next/server";
import { verifySession, isAdminEmail } from "@/lib/auth";

// Called right after any login (staff /auth/login and customer
// /account/login + /account/signup) to decide where to send the user:
// admins (ADMIN_EMAILS) land on the dashboard, everyone else on their
// customer account section.
export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ url: "/account/login" });

  return NextResponse.json({ url: isAdminEmail(user.email) ? "/dashboard" : "/account" });
}
