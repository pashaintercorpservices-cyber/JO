import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { formatRupees } from "@/lib/format";
import { PaymentPanel } from "./PaymentPanel";

export default async function PayForAdPage({
  params,
  searchParams,
}: PageProps<"/agency/ads/[id]/pay">) {
  const { id } = await params;
  const sp = await searchParams;
  const paymentId = typeof sp.payment === "string" ? sp.payment : undefined;
  if (!paymentId) redirect(`/agency/ads/${id}`);

  const supabase = await createClient();
  const { data: ad } = await supabase.from("job_ads").select("*").eq("id", id).single();
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!ad || !payment) notFound();

  if (payment.status === "paid") redirect(`/agency/ads/${id}`);

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Payment</p>
        <h1>Pay to publish “{ad.title}”</h1>
        <p>{formatRupees(payment.amount_paise)} inclusive of taxes — includes FB &amp; Instagram promotion.</p>
      </div>
      <div className="card" style={{ maxWidth: 460 }}>
        <PaymentPanel
          jobAdId={ad.id}
          paymentId={payment.id}
          orderId={payment.razorpay_order_id!}
          amountPaise={payment.amount_paise}
          razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""}
          mockMode={!isRazorpayConfigured()}
        />
      </div>
    </>
  );
}
