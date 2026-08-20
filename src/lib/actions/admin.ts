"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
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

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.profile.is_super_admin) {
    throw new Error("Only a super admin can do this.");
  }
  return user;
}

// Uses the Auth Admin API (service role), not a table update -- RLS can't gate this,
// so the super-admin check above is the only thing standing between this and any
// authenticated user resetting anyone's password. Do not relax requireSuperAdmin here.
export async function resetUserPasswordAction(targetUserId: string, newPassword: string) {
  await requireSuperAdmin();
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  });
  if (error) throw new Error(error.message);
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

// Deletes below are super-admin only per the platform's own policy (not just a technical
// RLS gate) -- they're destructive and, for job ads/agencies, cascade to everything
// underneath (vacancies, payments, applications). Uses the admin client since some of
// these tables don't grant DELETE to the regular admin role via RLS.

export async function deleteJobVacancyAction(vacancyId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("job_vacancies").delete().eq("id", vacancyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ads");
}

export async function deleteJobAdAction(jobAdId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("job_ads").delete().eq("id", jobAdId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ads");
  revalidatePath("/admin");
}

export async function deleteApplicationAction(applicationId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("applications").delete().eq("id", applicationId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/applications");
  revalidatePath("/admin/ads");
}

// Deletes the auth.users row via the Admin API. profiles.id has an ON DELETE CASCADE
// foreign key to auth.users, which cascades through agencies -> job_ads -> job_vacancies/
// payments/applications, so this one call removes the whole account tree.
export async function deleteUserAction(profileId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}
