import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diagnoseScoring } from "@/lib/matching";

/**
 * On-demand health check for the AI match-scoring pipeline (Gemini primary, Claude
 * fallback), gated by a token stored in ops.admin_api_tokens -- never an env var or
 * cookie session, since this is called from an operator session, not a browser.
 * Runs a fixed test case against both providers independently (no early return on
 * first success) so a config problem can be confirmed in one request instead of
 * waiting for a real application and reconstructing it from logs.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { token } = body as { token?: string };

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
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

  const { gemini, claude } = await diagnoseScoring();

  return NextResponse.json({
    ok: true,
    gemini: { configured: gemini.error !== "gemini:no_key", working: gemini.result !== null, error: gemini.error, result: gemini.result },
    claude: { configured: claude.error !== "claude:no_key", working: claude.result !== null, error: claude.error, result: claude.result },
    active_provider: gemini.result ? "gemini" : claude.result ? "claude" : "none",
  });
}
