"use server";

import { createClient } from "@/lib/supabase/server";
import { sendApplicationEmail } from "@/lib/email";

export type ApplyFormState = { error?: string; success?: boolean };

export async function submitApplicationAction(
  _prev: ApplyFormState,
  formData: FormData
): Promise<ApplyFormState> {
  const jobAdId = String(formData.get("job_ad_id") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const consent = formData.get("consent") === "on";

  if (!jobAdId) return { error: "Select the vacancy you're applying for." };
  if (!name || !email || !phone) {
    return { error: "Name, email and contact number are required." };
  }
  if (!consent) {
    return { error: "Please confirm you consent to sharing your details with the advertising agency." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ad } = await supabase
    .from("job_ads")
    .select("id, title, status, contact_email")
    .eq("id", jobAdId)
    .single();

  if (!ad || ad.status !== "live") {
    return { error: "This vacancy is no longer accepting applications." };
  }

  const { error } = await supabase.from("applications").insert({
    job_ad_id: ad.id,
    applicant_profile_id: user?.id ?? null,
    name,
    email,
    phone,
    position_applied: ad.title,
    source: user ? "account" : "guest",
    consent: true,
  });

  if (error) return { error: error.message };

  await sendApplicationEmail({
    to: ad.contact_email,
    applicantName: name,
    applicantEmail: email,
    applicantPhone: phone,
    positionTitle: ad.title,
  });

  return { success: true };
}
