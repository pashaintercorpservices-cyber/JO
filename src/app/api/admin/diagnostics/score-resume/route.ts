import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractResumeText, scoreResumeMatch } from "@/lib/matching";

/**
 * On-demand scoring test against a real resume file, without creating an applications
 * row or sending any email -- for verifying the extraction+scoring pipeline end-to-end
 * against real documents (e.g. scanned PDFs) without polluting production data. Gated
 * the same way as the other diagnostics route.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { token, resumeBase64, resumeFileName, positionTitle, jobDetails } = body as {
    token?: string;
    resumeBase64?: string;
    resumeFileName?: string;
    positionTitle?: string;
    jobDetails?: string;
  };

  if (!token || !resumeBase64 || !resumeFileName || !positionTitle) {
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

  const bytes = Buffer.from(resumeBase64, "base64");
  const resumeText = await extractResumeText(bytes, resumeFileName);
  const result = await scoreResumeMatch({ resumeText, positionTitle, jobDetails: jobDetails || "" });

  return NextResponse.json({
    ok: true,
    extracted_chars: resumeText.length,
    // First 200 chars only, as a legibility sanity-check -- never the full text of a
    // real candidate's document in a response body.
    extracted_preview: resumeText.slice(0, 200),
    score: result.score,
    summary: result.summary,
    provider: result.provider,
    error: result.error,
  });
}
