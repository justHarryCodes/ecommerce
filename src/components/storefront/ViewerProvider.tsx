"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getIdToken } from "firebase/auth";
import { auth, onAuthStateChanged } from "@/lib/firebase-client";

export interface Viewer {
  name: string;
  email: string;
  isAdmin: boolean;
}

interface Ctx {
  // undefined = still working it out; null = signed out
  viewer: Viewer | null | undefined;
  clear: () => void;
}

const ViewerContext = createContext<Ctx>({ viewer: undefined, clear: () => {} });
export const useViewer = () => useContext(ViewerContext);

const CACHE_KEY = "viewer";
const MINTED_KEY = "session-minted-at";
const RENEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // slide the 14-day cookie every ~3 days of use

function readCache(): Viewer | null {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null"); } catch { return null; }
}
function writeCache(v: Viewer | null) {
  try {
    if (v) localStorage.setItem(CACHE_KEY, JSON.stringify(v));
    else localStorage.removeItem(CACHE_KEY);
  } catch {}
}

async function fetchViewer(): Promise<Viewer | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    return (await res.json()).viewer ?? null;
  } catch {
    return null;
  }
}

async function mintSession(user: NonNullable<typeof auth.currentUser>): Promise<boolean> {
  try {
    const idToken = await getIdToken(user, true);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (res.ok) {
      try { localStorage.setItem(MINTED_KEY, String(Date.now())); } catch {}
    }
    return res.ok;
  } catch {
    return false;
  }
}

// Client-side only — public pages stay static and never depend on auth.
// Keeps the header's account menu (and login) sticky:
//  1. Paint instantly from a cached copy of the viewer (no "Sign In" flash).
//  2. Confirm with the server via /api/auth/me.
//  3. If the httpOnly cookie is gone/expired but Firebase still has the user
//     persisted in this browser, quietly mint a new cookie.
//  4. While signed in, renew the cookie every few days so it slides.
export default function ViewerProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<Viewer | null | undefined>(undefined);

  const clear = useCallback(() => {
    writeCache(null);
    setViewer(null);
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached) setViewer(cached);

    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      let v = await fetchViewer();

      if (!v && user) {
        // Firebase remembers them but the cookie lapsed → restore silently
        if (await mintSession(user)) v = await fetchViewer();
      } else if (v && user) {
        let last = 0;
        try { last = Number(localStorage.getItem(MINTED_KEY) ?? 0); } catch {}
        if (Date.now() - last > RENEW_AFTER_MS) mintSession(user);
      }

      if (cancelled) return;
      writeCache(v);
      setViewer(v);
    });

    return () => { cancelled = true; unsub(); };
  }, []);

  return <ViewerContext.Provider value={{ viewer, clear }}>{children}</ViewerContext.Provider>;
}
