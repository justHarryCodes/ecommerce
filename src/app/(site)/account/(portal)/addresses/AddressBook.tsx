"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, MapPin, Plus, Star, Trash2, Pencil } from "lucide-react";

export interface SavedAddress {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  is_default: boolean;
}

interface FormState {
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const EMPTY: FormState = { label: "Home", recipientName: "", phone: "", address: "", city: "", state: "", isDefault: false };

const input = "w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2";
const card = "bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800";

export default function AddressBook({
  addresses,
  defaults,
}: {
  addresses: SavedAddress[];
  defaults: { recipient_name: string; phone: string };
}) {
  const router = useRouter();
  // null = form closed, "new" = adding, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function openNew() {
    setForm({ ...EMPTY, recipientName: defaults.recipient_name, phone: defaults.phone });
    setEditing("new");
  }

  function openEdit(a: SavedAddress) {
    setForm({
      label: a.label, recipientName: a.recipient_name, phone: a.phone, address: a.address,
      city: a.city ?? "", state: a.state ?? "", isDefault: a.is_default,
    });
    setEditing(a.id);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isNew = editing === "new";
      const body = isNew ? form : { ...form, isDefault: form.isDefault || undefined };
      const res = await fetch(isNew ? "/api/account/addresses" : `/api/account/addresses/${editing}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Couldn't save address");
      toast.success(isNew ? "Address added" : "Address updated");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save address");
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, fn: () => Promise<Response>, ok: string) {
    setBusyId(id);
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      toast.success(ok);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  const makeDefault = (id: string) =>
    act(id, () => fetch(`/api/account/addresses/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }),
    }), "Default address updated");

  const remove = (id: string) => {
    if (!confirm("Delete this address?")) return;
    act(id, () => fetch(`/api/account/addresses/${id}`, { method: "DELETE" }), "Address deleted");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Delivery addresses</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your default address is prefilled at checkout.</p>
        </div>
        {editing === null && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "var(--accent)" }}>
            <Plus className="w-4 h-4" /> Add address
          </button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={save} className={`${card} p-5 grid sm:grid-cols-2 gap-4`}>
          <h3 className="sm:col-span-2 font-bold" style={{ color: "var(--text-primary)" }}>
            {editing === "new" ? "New address" : "Edit address"}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Label</label>
            <input name="label" value={form.label} onChange={change} placeholder="Home, Office…" required className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Recipient name</label>
            <input name="recipientName" value={form.recipientName} onChange={change} required className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Phone</label>
            <input name="phone" type="tel" value={form.phone} onChange={change} required className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>City</label>
            <input name="city" value={form.city} onChange={change} className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Street address</label>
            <input name="address" value={form.address} onChange={change} required className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>State</label>
            <input name="state" value={form.state} onChange={change} className={input} style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <label className="flex items-center gap-2 text-sm self-end pb-3" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4" />
            Make this my default address
          </label>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save address
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && editing === null ? (
        <div className={`${card} p-12 text-center`}>
          <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={`${card} p-5 flex flex-col`} style={a.is_default ? { borderColor: "var(--accent)" } : undefined}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{a.label}</span>
                {a.is_default && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--accent)" }}>Default</span>
                )}
              </div>
              <div className="text-sm space-y-0.5 flex-1" style={{ color: "var(--text-secondary)" }}>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{a.recipient_name}</p>
                <p>{a.address}</p>
                <p>{[a.city, a.state].filter(Boolean).join(", ")}</p>
                <p>{a.phone}</p>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                {!a.is_default && (
                  <button onClick={() => makeDefault(a.id)} disabled={busyId === a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80" style={{ color: "var(--accent)" }}>
                    <Star className="w-3.5 h-3.5" /> Set default
                  </button>
                )}
                <button onClick={() => openEdit(a)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => remove(a.id)} disabled={busyId === a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:opacity-80 ml-auto">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
