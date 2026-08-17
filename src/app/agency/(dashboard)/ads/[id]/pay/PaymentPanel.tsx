"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmMockPaymentAction } from "@/lib/actions/jobAds";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function PaymentPanel({
  jobAdId,
  paymentId,
  orderId,
  amountPaise,
  razorpayKeyId,
  mockMode,
}: {
  jobAdId: string;
  paymentId: string;
  orderId: string;
  amountPaise: number;
  razorpayKeyId: string;
  mockMode: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMockPay() {
    setBusy(true);
    setError(null);
    try {
      await confirmMockPaymentAction(jobAdId, paymentId, orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not be confirmed.");
      setBusy(false);
    }
  }

  function handleRealPay() {
    setBusy(true);
    setError(null);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: amountPaise,
        currency: "INR",
        name: "JobOverseas",
        description: "Job ad posting fee",
        order_id: orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const res = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, payment_id: paymentId }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.error || "Payment verification failed.");
            setBusy(false);
            return;
          }
          router.push(`/agency/ads/${jobAdId}?paid=1`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    };
    document.body.appendChild(script);
  }

  if (mockMode) {
    return (
      <>
        <div className="form-error" style={{ background: "var(--warn-tint)", color: "var(--warn)" }}>
          Razorpay isn&apos;t configured yet — running in test mode. This confirms the ad exactly
          as a real payment would, without contacting Razorpay.
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy} onClick={handleMockPay}>
          {busy ? "Confirming…" : "Simulate payment"}
        </button>
      </>
    );
  }

  return (
    <>
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-block" disabled={busy} onClick={handleRealPay}>
        {busy ? "Opening Razorpay…" : "Pay with Razorpay"}
      </button>
    </>
  );
}
