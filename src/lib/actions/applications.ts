"use server";

import { createClient } from "@/lib/supabase/server";
import { sendApplicationEmail } from "@/lib/email";
import { getResumeSignedUrl } from "@/lib/resume";

export type ApplyFormState = { error?: string; success?: boolean };

export async function submitApplicationAction(
  _prev: ApplyFormState,
  formData: FormData
): Promise<ApplyFormState> {
  const jobVacancyId = String(formData.get("job_vacancy_id") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const resumePath = String(formData.get("resume_path") || "").trim();
  const consent = formData.get("consent") === "on";

  if (!jobVacancyId) return { error: "Select the vacancy you're applying for." };
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

  const { data: vacancy } = await supabase
    .from("job_vacancies")
    .select("id, title, job_ad_id, job_ads(id, status, contact_email)")
    .eq("id", jobVacancyId)
    .single();

  const parentAd = (
    vacancy as { job_ads?: { id: string; status: string; contact_email: string } } | null
  )?.job_ads;

  if (!vacancy || !parentAd || parentAd.status !== "live") {
    return { error: "This vacancy is no longer accepting applications." };
  }

  const { error } = await supabase.from("applications").insert({
    job_ad_id: parentAd.id,
    job_vacancy_id: vacancy.id,
    applicant_profile_id: user?.id ?? null,
    name,
    email,
    phone,
    position_applied: vacancy.title,
    resume_url: resumePath || null,
    source: user ? "account" : "guest",
    consent: true,
  });

  if (error) return { error: error.message };

  // 30-day link embedded in the one-time notification email; the agency dashboard/admin
  // views generate their own fresh short-lived link each time instead of reusing this one.
  const resumeLinkForEmail = resumePath
    ? (await getResumeSignedUrl(resumePath, 60 * 60 * 24 * 30)) ?? undefined
    : undefined;

  await sendApplicationEmail({
    to: parentAd.contact_email,
    applicantName: name,
    applicantEmail: email,
    applicantPhone: phone,
    positionTitle: vacancy.title,
    resumeUrl: resumeLinkForEmail,
  });

  return { success: true };
}
