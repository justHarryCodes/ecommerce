"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { Loader2, Save, KeyRound } from "lucide-react";
import { auth } from "@/lib/firebase-client";

const input = "w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2";
const card = "bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6";

export default function ProfileForm({ email, initial }: { email: string; initial: { name: string; phone: string } }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset link sent to ${email}`);
    } catch {
      toast.error("Couldn't send the reset email. Try again shortly.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <form onSubmit={save} className={`${card} grid sm:grid-cols-2 gap-4`}>
        <h2 className="sm:col-span-2 font-bold" style={{ color: "var(--text-primary)" }}>Personal information</h2>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input value={email} disabled className={`${input} opacity-60 cursor-not-allowed`} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Full name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </form>

      <section className={card}>
        <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Password</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          We&apos;ll email you a secure link to set a new password. (Not applicable if you sign in with Google.)
        </p>
        <button onClick={resetPassword} disabled={resetting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-60" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Send password reset email
        </button>
      </section>
    </div>
  );
}
