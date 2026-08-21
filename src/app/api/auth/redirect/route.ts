import { NextResponse } from "next/server";
import { verifySession, getUserStore } from "@/lib/auth";

// Used only by the staff login page (/auth/login) to decide where to send
// a just-authenticated user. A logged-in non-admin (e.g. a customer who
// wandered onto the staff login form) goes home rather than bouncing back
// to the login form they just submitted.
export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ url: "/auth/login" });

  const store = await getUserStore(user.firebaseUid);
  if (!store) return NextResponse.json({ url: "/" });

  return NextResponse.json({ url: "/dashboard" });
}
