"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationEmail, sendCandidateConfirmationEmail } from "@/lib/email";
import { getResumeSignedUrl } from "@/lib/resume";
import { getVideoIntroSignedUrl } from "@/lib/video";
import { extractResumeText, scoreResumeMatch } from "@/lib/matching";

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
  const suitabilityAnswer = String(formData.get("suitability_answer") || "").trim();
  const resumeConfirmed = formData.get("resume_confirmed") === "on";
  const availabilityConfirmed = formData.get("availability_confirmed") === "on";
  const videoIntroPath = String(formData.get("video_intro_path") || "").trim();
  const videoIntroSecondsRaw = String(formData.get("video_intro_seconds") || "").trim();

  if (!jobVacancyId) return { error: "Select the vacancy you're applying for." };
  if (!name || !email || !phone) {
    return { error: "Name, email and contact number are required." };
  }
  if (!resumePath) {
    return { error: "Please attach your resume/CV." };
  }
  if (!consent) {
    return { error: "Please confirm you consent to sharing your details with the advertising agency." };
  }
  if (!suitabilityAnswer) {
    return { error: "Please tell us why you're suitable for this vacancy." };
  }
  if (!resumeConfirmed) {
    return { error: "Please confirm you've attached the correct file/resume." };
  }
  if (!availabilityConfirmed) {
    return { error: "Please confirm your interest and availability for the job location." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vacancy } = await supabase
    .from("job_vacancies")
    .select(
      "id, title, details, job_ad_id, require_video_intro, job_ads(id, status, contact_email, contact_name, contact_phone, employer_name, min_match_score)"
    )
    .eq("id", jobVacancyId)
    .single();

  const parentAd = (
    vacancy as {
      job_ads?: {
        id: string;
        status: string;
        contact_email: string;
        contact_name: string | null;
        contact_phone: string | null;
        employer_name: string | null;
        min_match_score: number | null;
      };
    } | null
  )?.job_ads;

  if (!vacancy || !parentAd || parentAd.status !== "live") {
    return { error: "This vacancy is no longer accepting applications." };
  }

  // Server-side enforcement -- the client hides/shows the recorder based on this same
  // flag, but that's a UI convenience only, not the actual gate.
  if (vacancy.require_video_intro && !videoIntroPath) {
    return { error: "This vacancy requires a short video introduction — please record one before submitting." };
  }

  // Best-effort JD match scoring. Never blocks submission -- on any failure the
  // application still goes through, with match_score_error recording *why* scoring
  // didn't happen so it's queryable later instead of a silent, unexplained null.
  let matchScore: number | null = null;
  let matchSummary: string | null = null;
  let matchScoreError: string | null = null;
  try {
    const admin = createAdminClient();
    const { data: resumeBlob } = await admin.storage.from("resumes").download(resumePath);
    if (resumeBlob) {
      const bytes = Buffer.from(await resumeBlob.arrayBuffer());
      const resumeText = await extractResumeText(bytes, resumePath);
      const result = await scoreResumeMatch({
        resumeText,
        positionTitle: vacancy.title,
        jobDetails: vacancy.details || "",
      });
      matchScore = result.score;
      matchSummary = result.summary;
      matchScoreError = result.error;
    } else {
      matchScoreError = "storage:download_failed";
    }
  } catch (err) {
    matchScoreError = `unexpected:${err instanceof Error ? err.message : "unknown"}`;
    console.error("[applications:match-scoring-failed]", err);
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
    suitability_answer: suitabilityAnswer,
    resume_confirmed: resumeConfirmed,
    availability_confirmed: availabilityConfirmed,
    match_score: matchScore,
    match_summary: matchSummary,
    match_score_error: matchScoreError,
    video_intro_url: videoIntroPath || null,
    video_intro_seconds: videoIntroSecondsRaw ? Number(videoIntroSecondsRaw) : null,
  });

  if (error) return { error: error.message };

  // 30-day links embedded in the one-time notification email; the agency dashboard/admin
  // views generate their own fresh short-lived link each time instead of reusing this one.
  const resumeLinkForEmail = resumePath
    ? (await getResumeSignedUrl(resumePath, 60 * 60 * 24 * 30)) ?? undefined
    : undefined;
  const videoLinkForEmail = videoIntroPath
    ? (await getVideoIntroSignedUrl(videoIntroPath, 60 * 60 * 24 * 30)) ?? undefined
    : undefined;

  // Agency's own screening preference: only forward applications at/above their
  // threshold. Fails open (still sends) when scoring wasn't available at all, so a
  // configuration gap never silently hides a real candidate.
  const meetsAgencyThreshold =
    parentAd.min_match_score == null || matchScore == null || matchScore >= parentAd.min_match_score;

  if (meetsAgencyThreshold) {
    await sendApplicationEmail({
      to: parentAd.contact_email,
      applicantName: name,
      applicantEmail: email,
      applicantPhone: phone,
      positionTitle: vacancy.title,
      resumeUrl: resumeLinkForEmail,
      suitabilityAnswer,
      matchScore,
      matchSummary,
      videoIntroUrl: videoLinkForEmail,
    });
  }

  await sendCandidateConfirmationEmail({
    to: email,
    applicantName: name,
    positionTitle: vacancy.title,
    employerName: parentAd.employer_name,
    hasResume: Boolean(resumePath),
    contactName: parentAd.contact_name,
    contactEmail: parentAd.contact_email,
    contactPhone: parentAd.contact_phone,
  });

  return { success: true };
}
