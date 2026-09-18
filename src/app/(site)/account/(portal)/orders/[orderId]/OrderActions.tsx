"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface Props {
  orderId: string;
  needsPaymentConfirm: boolean;
  canConfirmDelivery: boolean;
}

// Customer-side order confirmations. Both hit POST /api/account/orders/[id],
// which re-checks ownership and the order's current state server-side.
export default function OrderActions({ orderId, needsPaymentConfirm, canConfirmDelivery }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "confirm_payment" | "confirm_delivery", success: string) {
    setBusy(action);
    try {
      const res = await fetch(`/api/account/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "var(--accent)", background: "var(--accent-light)" }}>
      {needsPaymentConfirm && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Paid by bank transfer? Let us know so we can verify your payment and start your order.
          </p>
          <button
            onClick={() => run("confirm_payment", "Thanks — we'll verify your payment shortly")}
            disabled={busy !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {busy === "confirm_payment" && <Loader2 className="w-4 h-4 animate-spin" />}
            I&apos;ve made the payment
          </button>
        </div>
      )}
      {canConfirmDelivery && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Your order is on its way. Once it&apos;s arrived, confirm receipt to complete the order.
          </p>
          <button
            onClick={() => run("confirm_delivery", "Order marked as delivered — thank you!")}
            disabled={busy !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {busy === "confirm_delivery" && <Loader2 className="w-4 h-4 animate-spin" />}
            I&apos;ve received my order
          </button>
        </div>
      )}
    </section>
  );
}
