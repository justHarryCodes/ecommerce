"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LogOut, Loader2, Save, Package, User as UserIcon } from "lucide-react";
import type { Customer, Order, OrderItem } from "@/types";

interface Props {
  customer: Customer;
  orders: Order[];
  email: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
  processing: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800",
  delivered: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
  cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
};

export default function AccountClient({ customer, orders, email }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSave(e: React.FormEvent) {
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

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>My Account</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{email}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-60"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign out
        </button>
      </div>

      {/* Profile */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <UserIcon className="w-4 h-4" />
          Profile &amp; delivery address
        </h2>
        <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
          Saved here so checkout is prefilled next time you order.
        </p>
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Full name</label>
            <input name="name" value={form.name} onChange={change}
              className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Phone</label>
            <input name="phone" value={form.phone} onChange={change} type="tel"
              className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>City</label>
            <input name="city" value={form.city} onChange={change}
              className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Delivery address</label>
            <input name="address" value={form.address} onChange={change}
              className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>State</label>
            <input name="state" value={form.state} onChange={change}
              className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      </section>

      {/* Order history */}
      <section>
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Package className="w-4 h-4" />
          Order history
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No orders yet — items you buy will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{order.order_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_STYLES[order.order_status ?? "pending"]}`}>
                      {order.order_status}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDate(order.created_at ?? "")}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {(order.items as OrderItem[] | undefined)?.filter((it) => it.product_name).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>{item.product_name} × {item.quantity}</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Total</span>
                  <span className="font-black" style={{ color: "var(--text-primary)" }}>{formatCurrency(order.total ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
