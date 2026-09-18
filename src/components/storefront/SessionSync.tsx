"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";
import { auth, onAuthStateChanged } from "@/lib/firebase-client";

const MINTED_KEY = "session-minted-at";
const RENEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // re-mint every ~3 days of use

// Keeps the two halves of authentication in step so a login sticks:
//  - Firebase's client SDK persists the user in IndexedDB across visits;
//    the server reads an httpOnly `session` cookie (14 days). If the cookie
//    is missing/expired but Firebase still has the user, silently mint a
//    fresh cookie and refresh — the visitor never sees a logged-out flash.
//  - While signed in and active, re-mint the cookie every few days so the
//    14-day window slides instead of expiring mid-use.
export default function SessionSync({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const tried = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || tried.current) return;

      let lastMinted = 0;
      try { lastMinted = Number(localStorage.getItem(MINTED_KEY) ?? 0); } catch {}
      const stale = Date.now() - lastMinted > RENEW_AFTER_MS;
      if (hasSession && !stale) return;

      tried.current = true;
      try {
        const idToken = await getIdToken(user, true);
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (res.ok) {
          try { localStorage.setItem(MINTED_KEY, String(Date.now())); } catch {}
          if (!hasSession) router.refresh();
        }
      } catch {
        // Offline / transient — next page load retries.
        tried.current = false;
      }
    });
    return unsub;
  }, [hasSession, router]);

  return null;
}
