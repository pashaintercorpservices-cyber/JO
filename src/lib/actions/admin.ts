"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

type AdStatus = Database["public"]["Enums"]["ad_status"];
type PromoStatus = Database["public"]["Enums"]["promo_status"];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return supabase;
}

export async function setAdStatusAction(jobAdId: string, status: AdStatus) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("job_ads").update({ status }).eq("id", jobAdId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ads");
  revalidatePath("/admin");
}

export async function setPromoStatusAction(jobAdId: string, promoStatus: PromoStatus) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("job_ads")
    .update({ promo_status: promoStatus })
    .eq("id", jobAdId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ads");
}

export async function setAgencyVerifiedAction(agencyId: string, verified: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("agencies").update({ verified }).eq("id", agencyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// For payments received outside Razorpay (bank transfer, cash, etc.) -- confirms via the
// same trusted confirm_ad_payment RPC used by the real Razorpay webhook, just triggered
// manually by an admin instead of a signature-verified callback.
export async function markAdPaidManuallyAction(jobAdId: string) {
  const supabase = await requireAdmin();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, razorpay_order_id")
    .eq("job_ad_id", jobAdId)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (paymentError || !payment) throw new Error("No pending payment found for this ad.");

  const { error } = await supabase.rpc("confirm_ad_payment", {
    p_payment_id: payment.id,
    p_razorpay_order_id: payment.razorpay_order_id!,
    p_razorpay_payment_id: `manual_admin_${Date.now()}`,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ads");
  revalidatePath("/admin");
}
