import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOutreachEmail } from "@/lib/email";

// Lead Generation & Email Marketing Expert role in ops.roles -- fixed for this campaign.
const LEADGEN_ROLE_ID = "b84abe6b-9f25-4148-b9bb-897c9e276266";

/**
 * Single-recipient outreach send, gated by a token stored in ops.admin_api_tokens
 * (never committed to source -- this repo is public) rather than an env var or
 * cookie session, since this is triggered from an operator session, not a browser.
 * Logs every attempt (success or failure) to ops.email_outreach_log so the send
 * is tracked even if the caller's own session drops mid-batch.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { token, to, subject, html, replyTo, sourceRow, agencyName, location, campaign } = body as {
    token?: string;
    to?: string;
    subject?: string;
    html?: string;
    replyTo?: string;
    sourceRow?: number;
    agencyName?: string;
    location?: string;
    campaign?: string;
  };

  if (!token || !to || !subject || !html || !replyTo || !sourceRow || !agencyName) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .schema("ops")
    .from("admin_api_tokens")
    .select("token")
    .eq("token", token)
    .eq("purpose", "ra_outreach_send")
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  await admin
    .schema("ops")
    .from("admin_api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  const result = await sendOutreachEmail({ to, subject, html, replyTo });

  await admin.schema("ops").from("email_outreach_log").insert({
    role_id: LEADGEN_ROLE_ID,
    campaign: campaign || "ra_cold_outreach",
    source_row: sourceRow,
    agency_name: agencyName,
    agency_email: to,
    location: location || null,
    status: result.ok ? "sent" : "failed",
    error_message: result.ok ? null : result.error || "Send failed.",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Send failed." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
