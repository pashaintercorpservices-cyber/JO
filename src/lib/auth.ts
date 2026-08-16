import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Tables<"profiles">;
  agency: Tables<"agencies"> | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  let agency: Tables<"agencies"> | null = null;
  if (profile.role === "agency" || profile.is_super_admin) {
    const { data } = await supabase
      .from("agencies")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();
    agency = data ?? null;
  }

  return { id: user.id, email: user.email ?? null, profile, agency };
}
