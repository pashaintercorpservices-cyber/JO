import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    payment_id: paymentRowId,
  } = body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    payment_id?: string;
  };

  if (!orderId || !paymentId || !signature || !paymentRowId) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_ad_payment", {
    p_payment_id: paymentRowId,
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: paymentId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
