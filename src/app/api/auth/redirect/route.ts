import { NextResponse } from "next/server";
import { verifySession, getUserStore } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ url: "/auth/login" });

  const store = await getUserStore(user.firebaseUid);
  if (!store) return NextResponse.json({ url: "/auth/login" });

  return NextResponse.json({ url: "/dashboard" });
}
