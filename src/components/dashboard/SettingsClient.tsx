"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  MapPin,
  Compass,
  Check,
  Loader2,
  Upload,
  ExternalLink,
  Mail,
  KeyRound,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import type { Store as StoreType } from "@/types";
import { Tip } from "@/components/dashboard/Tip";
import { clLogo } from "@/lib/cloudinary";
import { uploadImage } from "@/lib/upload-image";

interface Props {
  store: StoreType;
}

type BusinessHours = { mon_fri?: string; sat?: string; sun?: string };
type SocialLinks = { facebook?: string; instagram?: string; linkedin?: string; twitter?: string };

export default function SettingsClient({ store: initial }: Props) {
  const router = useRouter();
  const [store, setStore] = useState(() => ({
    ...initial,
    businessHours: (initial.businessHours ?? initial.business_hours ?? {}) as BusinessHours,
    socialLinks: (initial.socialLinks ?? initial.social_links ?? {}) as SocialLinks,
    paymentPreference:
      initial.paymentPreference ?? initial.payment_preference ?? "paystack",
  }));
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({ currentPassword: "", newEmail: "", confirmEmail: "" });
  const [emailChanging, setEmailChanging] = useState(false);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      toast.error("New emails do not match");
      return;
    }
    if (!emailForm.newEmail.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setEmailChanging(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("Not signed in");

      const credential = EmailAuthProvider.credential(currentUser.email, emailForm.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await verifyBeforeUpdateEmail(currentUser, emailForm.newEmail);

      toast.success("Verification email sent to " + emailForm.newEmail + ". Click the link to confirm your new address.");
      setShowEmailForm(false);
      setEmailForm({ currentPassword: "", newEmail: "", confirmEmail: "" });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Incorrect current password");
      } else if (code === "auth/email-already-in-use") {
        toast.error("That email is already in use");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try again later.");
      } else {
        toast.error("Email change failed. Try again.");
      }
    } finally {
      setEmailChanging(false);
    }
  }

  const change = (key: keyof typeof store, value: unknown) =>
    setStore((s) => ({ ...s, [key]: value }));

  const changeHours = (key: keyof BusinessHours, value: string) =>
    setStore((s) => ({ ...s, businessHours: { ...s.businessHours, [key]: value } }));

  const changeSocial = (key: keyof SocialLinks, value: string) =>
    setStore((s) => ({ ...s, socialLinks: { ...s.socialLinks, [key]: value } }));

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadImage(file);
      change("logoUrl", url);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: store.name,
          description: store.description,
          logoUrl: store.logoUrl ?? store.logo_url,
          phone: store.phone,
          whatsapp: store.whatsapp,
          email: store.email,
          address: store.address,
          businessHours: store.businessHours,
          mapEmbedUrl: store.mapEmbedUrl ?? store.map_embed_url,
          socialLinks: store.socialLinks,
          vision: store.vision,
          mission: store.mission,
          paymentPreference: store.paymentPreference,
          bankName: store.bankName ?? store.bank_name,
          bankAccountNumber: store.bankAccountNumber ?? store.bank_account_number,
          bankAccountName: store.bankAccountName ?? store.bank_account_name,
          paystackPublicKey: store.paystackPublicKey ?? store.paystack_public_key,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success("Settings saved!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Manage the company profile shown across the site
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View site
        </a>
      </div>

      <Tip id="settings-guide" variant="tip">
        <strong>Tips:</strong> This info feeds the footer, Contact page, and quote-request notifications across the site. Add a WhatsApp number to enable the floating chat button and &ldquo;Request a Quote&rdquo; shortcuts.
      </Tip>

      {/* Company Info */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6 space-y-5">
        <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Store className="w-4 h-4" />
          Company information
        </h2>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Logo
          </label>
          <div className="flex items-center gap-4">
            {(store.logoUrl ?? store.logo_url) ? (
              <img
                src={clLogo(store.logoUrl ?? store.logo_url)}
                alt="Logo"
                loading="lazy"
                decoding="async"
                className="w-16 h-16 rounded-xl object-contain border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-300">
                <Store className="w-6 h-6" />
              </div>
            )}
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              className="sr-only"
            />
            <button
              onClick={() => logoRef.current?.click()}
              disabled={logoUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              {logoUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload logo
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Company name
            </label>
            <input
              value={store.name}
              onChange={(e) => change("name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Description
            </label>
            <textarea
              value={store.description ?? ""}
              onChange={(e) => change("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Phone number
              </label>
              <input
                value={store.phone ?? ""}
                onChange={(e) => change("phone", e.target.value)}
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                WhatsApp number
              </label>
              <input
                value={store.whatsapp ?? ""}
                onChange={(e) => change("whatsapp", e.target.value)}
                type="tel"
                placeholder="234801234567"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email
              </label>
              <input
                value={store.email ?? ""}
                onChange={(e) => change("email", e.target.value)}
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Address
              </label>
              <input
                value={store.address ?? ""}
                onChange={(e) => change("address", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Business hours & map */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6 space-y-5">
        <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Hours &amp; location
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Mon–Fri
            </label>
            <input
              value={store.businessHours.mon_fri ?? ""}
              onChange={(e) => changeHours("mon_fri", e.target.value)}
              placeholder="8:00 AM - 6:00 PM"
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Saturday
            </label>
            <input
              value={store.businessHours.sat ?? ""}
              onChange={(e) => changeHours("sat", e.target.value)}
              placeholder="9:00 AM - 4:00 PM"
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Sunday
            </label>
            <input
              value={store.businessHours.sun ?? ""}
              onChange={(e) => changeHours("sun", e.target.value)}
              placeholder="Closed"
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Google Maps embed URL
          </label>
          <input
            value={store.mapEmbedUrl ?? store.map_embed_url ?? ""}
            onChange={(e) => change("mapEmbedUrl", e.target.value)}
            placeholder="https://www.google.com/maps/embed?..."
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
          />
          <p className="text-xs text-surface-400 mt-1">
            Google Maps → Share → Embed a map → copy the src URL. Shown on the Contact page.
          </p>
        </div>
      </section>

      {/* Social links */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6 space-y-5">
        <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          Social links
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["facebook", "instagram", "linkedin", "twitter"] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 capitalize">
                {key}
              </label>
              <input
                value={store.socialLinks[key] ?? ""}
                onChange={(e) => changeSocial(key, e.target.value)}
                placeholder={`https://${key}.com/...`}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Payment settings — used at checkout for products marked "Add to Cart" */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6 space-y-5">
        <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment settings
        </h2>
        <p className="text-xs text-surface-400 -mt-3">
          Only used for products marked &ldquo;Add to Cart&rdquo; in the product editor — quote-only products don&apos;t need this.
        </p>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Accepted payment methods
          </label>
          <div className="grid sm:grid-cols-3 gap-2">
            {(["paystack", "bank_transfer", "both"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => change("paymentPreference", method)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                  store.paymentPreference === method
                    ? "border-accent-400 bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300"
                    : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                }`}
              >
                {method === "paystack"
                  ? "Paystack only"
                  : method === "bank_transfer"
                    ? "Bank transfer only"
                    : "Both methods"}
              </button>
            ))}
          </div>
        </div>

        {(store.paymentPreference === "bank_transfer" || store.paymentPreference === "both") && (
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Bank name
              </label>
              <input
                value={store.bankName ?? store.bank_name ?? ""}
                onChange={(e) => change("bankName", e.target.value)}
                placeholder="e.g. Access Bank"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Account number
                </label>
                <input
                  value={store.bankAccountNumber ?? store.bank_account_number ?? ""}
                  onChange={(e) => change("bankAccountNumber", e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Account name
                </label>
                <input
                  value={store.bankAccountName ?? store.bank_account_name ?? ""}
                  onChange={(e) => change("bankAccountName", e.target.value)}
                  placeholder="Company Ltd"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {(store.paymentPreference === "paystack" || store.paymentPreference === "both") && (
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Paystack public key
            </label>
            <input
              value={store.paystackPublicKey ?? store.paystack_public_key ?? ""}
              onChange={(e) => change("paystackPublicKey", e.target.value)}
              placeholder="pk_live_..."
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm font-mono"
            />
            <p className="text-xs text-surface-400 mt-1">
              Found in your Paystack dashboard under Settings → API Keys. The secret key lives server-side in the environment, not here.
            </p>
          </div>
        )}
      </section>

      {/* Vision & Mission */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6 space-y-5">
        <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Compass className="w-4 h-4" />
          Vision &amp; mission
        </h2>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Vision
          </label>
          <textarea
            value={store.vision ?? ""}
            onChange={(e) => change("vision", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Mission
          </label>
          <textarea
            value={store.mission ?? ""}
            onChange={(e) => change("mission", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm resize-none"
          />
        </div>
        <p className="text-xs text-surface-400">Shown on the About page.</p>
      </section>

      {/* Account security — email change */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6 space-y-5">
        <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Account email
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-surface-500 dark:text-surface-400">Current email</p>
            <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5">
              {auth.currentUser?.email ?? "—"}
            </p>
          </div>
          {!showEmailForm && (
            <button
              onClick={() => setShowEmailForm(true)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Change email
            </button>
          )}
        </div>

        {showEmailForm && (
          <form onSubmit={handleEmailChange} className="space-y-4 pt-2 border-t border-surface-100 dark:border-surface-800">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Re-enter your current password to verify it&apos;s you, then enter the new email. A verification link will be sent to the new address.
            </p>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Current password
              </label>
              <input
                type="password"
                required
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                New email address
              </label>
              <input
                type="email"
                required
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Confirm new email
              </label>
              <input
                type="email"
                required
                value={emailForm.confirmEmail}
                onChange={(e) => setEmailForm((f) => ({ ...f, confirmEmail: e.target.value }))}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-transparent text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={emailChanging}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-accent-400 hover:bg-accent-500 text-black transition-all disabled:opacity-60"
              >
                {emailChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send verification
              </button>
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setEmailForm({ currentPassword: "", newEmail: "", confirmEmail: "" }); }}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Save button */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-accent-400 hover:bg-accent-500 text-black transition-all disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save settings
        </button>
      </div>
    </div>
  );
}
