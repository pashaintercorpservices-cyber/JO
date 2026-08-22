import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export const FIRST_POST_DISCOUNT_PERCENT = 25;
export const FIRST_POST_DISCOUNT_CODE = "FIRST25";

/**
 * Eligible only for an agency that has never completed a paid post before -- a
 * pending/failed payment doesn't count, so a first attempt that failed can still
 * retry at the discounted rate.
 */
export async function isEligibleForFirstPostDiscount(
  supabase: SupabaseClient<Database>,
  agencyId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("status", "paid");
  if (error) return false; // fail closed -- never discount on an unverifiable check
  return (count ?? 0) === 0;
}

export function applyFirstPostDiscount(baseAmountPaise: number): number {
  return Math.round((baseAmountPaise * (100 - FIRST_POST_DISCOUNT_PERCENT)) / 100);
}
