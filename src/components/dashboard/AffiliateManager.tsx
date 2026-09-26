"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Loader2, Copy, Check, Users, ChevronDown, ChevronUp, Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Affiliate } from "@/types";

interface Props {
  initialAffiliates: Affiliate[];
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";

function num(v: unknown): number {
  return Number(v ?? 0);
}

export default function AffiliateManager({ initialAffiliates }: Props) {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState(initialAffiliates);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", commissionRate: "10" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payoutDrafts, setPayoutDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function patch(id: string, changes: Partial<Affiliate>) {
    setAffiliates((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  async function handleAdd() {
    if (!addForm.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
          commissionRate: addForm.commissionRate ? Number(addForm.commissionRate) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add affiliate");
      toast.success("Affiliate added!");
      setShowAdd(false);
      setAddForm({ name: "", email: "", phone: "", commissionRate: "10" });
      router.refresh();
      setAffiliates((prev) => [{ ...data.data, orderCount: 0, totalCommission: 0 }, ...prev]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add affiliate");
    } finally {
      setSaving(false);
    }
  }

  async function updateAffiliate(id: string, body: Record<string, unknown>, successMsg: string) {
    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      patch(id, data.data);
      toast.success(successMsg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  function toggleActive(a: Affiliate) {
    const isActive = a.isActive ?? a.is_active ?? true;
    updateAffiliate(a.id, { isActive: !isActive }, !isActive ? "Affiliate reactivated" : "Affiliate paused");
  }

  function changeRate(a: Affiliate, rate: string) {
    const n = Number(rate);
    if (isNaN(n) || n < 0 || n > 100) return;
    updateAffiliate(a.id, { commissionRate: n }, "Commission rate updated");
  }

  async function addPayout(a: Affiliate) {
    const raw = payoutDrafts[a.id];
    const amount = Number(raw);
    if (!raw || isNaN(amount) || amount <= 0) { toast.error("Enter a valid payout amount"); return; }
    await updateAffiliate(a.id, { addPayout: amount }, `Recorded ₦${amount.toLocaleString()} payout`);
    setPayoutDrafts((prev) => ({ ...prev, [a.id]: "" }));
  }

  function copyLink(a: Affiliate) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/products?ref=${a.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(a.id);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add affiliate
      </button>

      {showAdd && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Name *</label>
            <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Email</label>
            <input value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Phone</label>
            <input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="080..." className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Commission rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={addForm.commissionRate}
              onChange={(e) => setAddForm((f) => ({ ...f, commissionRate: e.target.value }))} className={inputClass} />
          </div>
          <p className="sm:col-span-2 text-xs text-surface-400">
            If they later sign up at /affiliate/signup with this same email, their account links to this profile automatically.
          </p>
          <div className="sm:col-span-2 flex gap-3">
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white text-sm font-medium">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-400 hover:bg-accent-500 disabled:opacity-50 text-black text-sm font-bold transition-all">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Adding…" : "Add affiliate"}
            </button>
          </div>
        </div>
      )}

      {affiliates.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-12 text-center">
          <Users className="w-10 h-10 text-surface-200 dark:text-surface-700 mx-auto mb-3" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-1">No affiliates yet</h3>
          <p className="text-sm text-surface-400">Add a partner, or share /affiliate/signup so people can sign themselves up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {affiliates.map((a) => {
            const isActive = a.isActive ?? a.is_active ?? true;
            const earned = num(a.totalCommission ?? a.total_commission);
            const paid = num(a.totalPaid ?? a.total_paid);
            const owed = Math.max(0, earned - paid);
            const orderCount = a.orderCount ?? a.order_count ?? 0;
            const rate = num(a.commissionRate ?? a.commission_rate);
            const expanded = expandedId === a.id;

            return (
              <div key={a.id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 overflow-hidden">
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-surface-900 dark:text-white">{a.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
                        {a.code}
                      </span>
                      {!isActive && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-500">
                          Paused
                        </span>
                      )}
                      {!(a.firebaseUid ?? a.firebase_uid) && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                          Hasn&apos;t signed up
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {(a.email || "no email")}{a.phone ? ` · ${a.phone}` : ""} · joined {formatDate(a.createdAt ?? a.created_at ?? "")}
                    </p>
                  </div>

                  <button
                    onClick={() => copyLink(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:border-accent-400"
                  >
                    {copiedId === a.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === a.id ? "Copied" : "Copy link"}
                  </button>

                  <button
                    onClick={() => toggleActive(a)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isActive ? "bg-accent-400" : "bg-surface-200 dark:bg-surface-700"}`}
                    title={isActive ? "Pause affiliate" : "Reactivate affiliate"}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>

                  <button
                    onClick={() => setExpandedId(expanded ? null : a.id)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 px-4 pb-4 text-center">
                  <div>
                    <p className="text-sm font-black text-surface-900 dark:text-white">{orderCount}</p>
                    <p className="text-[10px] text-surface-400 uppercase tracking-wide">Orders</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-surface-900 dark:text-white">{formatCurrency(earned)}</p>
                    <p className="text-[10px] text-surface-400 uppercase tracking-wide">Earned</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-surface-900 dark:text-white">{formatCurrency(paid)}</p>
                    <p className="text-[10px] text-surface-400 uppercase tracking-wide">Paid</p>
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: owed > 0 ? "var(--accent, #b5622a)" : undefined }}>{formatCurrency(owed)}</p>
                    <p className="text-[10px] text-surface-400 uppercase tracking-wide">Owed</p>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-surface-100 dark:border-surface-800 p-4 grid sm:grid-cols-2 gap-4 bg-surface-50 dark:bg-surface-800/30">
                    <div>
                      <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Commission rate (%)</label>
                      <input
                        type="number" min="0" max="100" step="0.5" defaultValue={rate}
                        onBlur={(e) => changeRate(a, e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
                        Record a payout {owed > 0 && `(₦${owed.toLocaleString()} owed)`}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number" min="0" step="0.01"
                          value={payoutDrafts[a.id] ?? ""}
                          onChange={(e) => setPayoutDrafts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          placeholder="Amount paid"
                          className={inputClass}
                        />
                        <button
                          onClick={() => addPayout(a)}
                          className="flex items-center gap-1.5 px-4 rounded-lg bg-accent-400 hover:bg-accent-500 text-black text-sm font-bold shrink-0"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
