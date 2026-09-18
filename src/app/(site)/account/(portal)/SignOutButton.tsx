"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Loader2, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase-client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-60"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      Sign out
    </button>
  );
}
