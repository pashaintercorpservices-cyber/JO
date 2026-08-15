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
