import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractResumeText, scoreResumeMatch } from "@/lib/matching";
import { sendApplicationEmail, sendCandidateConfirmationEmail } from "@/lib/email";
import { getResumeSignedUrl } from "@/lib/resume";

/**
 * Staff-assisted submission for an application received outside the platform (e.g. a
 * resume sent directly to the agency) -- runs the exact same storage/extraction/scoring/
 * notification path a real self-service applicant would trigger, gated the same way as
 * the other diagnostics routes. `consent`/`resumeConfirmed`/`availabilityConfirmed` are
 * asserted true here because staff is the one entering an application it has actually
 * received, standing in for the checkboxes a self-service applicant would tick.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const {
    token,
    jobVacancyId,
    name,
    email,
    phone,
    resumeBase64,
    resumeFileName,
    suitabilityAnswer,
  } = body as {
    token?: string;
    jobVacancyId?: string;
    name?: string;
    email?: string;
    phone?: string;
    resumeBase64?: string;
    resumeFileName?: string;
    suitabilityAnswer?: string;
  };

  if (!token || !jobVacancyId || !name || !email || !phone || !resumeBase64 || !resumeFileName) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .schema("ops")
    .from("admin_api_tokens")
    .select("token")
    .eq("token", token)
    .eq("purpose", "match_scoring_diagnostics")
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  await admin
    .schema("ops")
    .from("admin_api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  const { data: vacancy } = await admin
    .from("job_vacancies")
    .select(
      "id, title, details, job_ad_id, job_ads(id, status, contact_email, contact_name, contact_phone, employer_name, min_match_score)"
    )
    .eq("id", jobVacancyId)
    .single();

  const parentAd = (
    vacancy as unknown as {
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

  if (!vacancy || !parentAd) {
    return NextResponse.json({ error: "Vacancy not found." }, { status: 404 });
  }

  const bytes = Buffer.from(resumeBase64, "base64");
  const resumePath = `staff-submitted/${jobVacancyId}/${Date.now()}-${resumeFileName}`;
  const { error: uploadError } = await admin.storage.from("resumes").upload(resumePath, bytes, {
    contentType: "application/pdf",
  });
  if (uploadError) {
    return NextResponse.json({ error: `Resume upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const resumeText = await extractResumeText(bytes, resumeFileName);
  const scored = await scoreResumeMatch({
    resumeText,
    positionTitle: vacancy.title,
    jobDetails: vacancy.details || "",
    resumeBytes: bytes,
    resumeFileName,
  });

  const { data: inserted, error: insertError } = await admin
    .from("applications")
    .insert({
      job_ad_id: parentAd.id,
      job_vacancy_id: vacancy.id,
      applicant_profile_id: null,
      name,
      email,
      phone,
      position_applied: vacancy.title,
      resume_url: resumePath,
      source: "guest",
      consent: true,
      suitability_answer: suitabilityAnswer || null,
      resume_confirmed: true,
      availability_confirmed: true,
      match_score: scored.score,
      match_summary: scored.summary,
      match_score_error: scored.error,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const meetsAgencyThreshold =
    parentAd.min_match_score == null || scored.score == null || scored.score >= parentAd.min_match_score;

  let notified = false;
  if (meetsAgencyThreshold) {
    const resumeLink = (await getResumeSignedUrl(resumePath, 60 * 60 * 24 * 30)) ?? undefined;
    await sendApplicationEmail({
      to: parentAd.contact_email,
      applicantName: name,
      applicantEmail: email,
      applicantPhone: phone,
      positionTitle: vacancy.title,
      resumeUrl: resumeLink,
      suitabilityAnswer: suitabilityAnswer || "",
      matchScore: scored.score,
      matchSummary: scored.summary,
    });
    notified = true;
  }

  await sendCandidateConfirmationEmail({
    to: email,
    applicantName: name,
    positionTitle: vacancy.title,
    employerName: parentAd.employer_name,
    hasResume: true,
    contactName: parentAd.contact_name,
    contactEmail: parentAd.contact_email,
    contactPhone: parentAd.contact_phone,
  });

  return NextResponse.json({
    ok: true,
    application_id: inserted?.id,
    match_score: scored.score,
    match_summary: scored.summary,
    match_provider: scored.provider,
    match_error: scored.error,
    agency_min_match_score: parentAd.min_match_score,
    agency_notified: notified,
  });
}
