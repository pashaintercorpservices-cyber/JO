import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOutreachEmail } from "@/lib/email";

// Lead Generation & Email Marketing Expert role in ops.roles -- fixed for this campaign.
const LEADGEN_ROLE_ID = "b84abe6b-9f25-4148-b9bb-897c9e276266";
const CAMPAIGN = "ra_cold_outreach";
const REPLY_TO = "mohsin@intercorpservices.in";
const DEFAULT_LIMIT = 50;

const LOGO_B64_PLACEHOLDER = "__LOGO_BASE64__"; // replaced below at module load

function buildHtml(agency: string, location: string): string {
  const loc = location
    ? location
        .toLowerCase()
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ")
    : "your area";
  return TEMPLATE.replaceAll("{{Agency Name}}", agency).replaceAll("{{Location}}", loc);
}

function buildSubject(agency: string): string {
  return `Post your Gulf/Overseas openings on JobsOverseas.in — ${agency}`;
}

/**
 * One call does the whole daily batch server-side: pull the next N unsent rows
 * from ops.outreach_agencies (ordered by source_row), send each via Resend,
 * log every attempt to ops.email_outreach_log, and mark successes as sent.
 * Designed so a scheduled trigger only needs a single authenticated POST --
 * no templating or Supabase access required on the caller's side.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { token, limit } = body as { token?: string; limit?: number };

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
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

  const batchLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 100);

  const { data: batch, error: fetchError } = await admin
    .schema("ops")
    .from("outreach_agencies")
    .select("source_row, agency_name, agency_email, location")
    .eq("sent", false)
    .order("source_row", { ascending: true })
    .limit(batchLimit);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!batch || batch.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, message: "No unsent rows remaining." });
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const row of batch) {
    const html = buildHtml(row.agency_name, row.location || "");
    const subject = buildSubject(row.agency_name);
    const result = await sendOutreachEmail({
      to: row.agency_email,
      subject,
      html,
      replyTo: REPLY_TO,
    });

    await admin.schema("ops").from("email_outreach_log").insert({
      role_id: LEADGEN_ROLE_ID,
      campaign: CAMPAIGN,
      source_row: row.source_row,
      agency_name: row.agency_name,
      agency_email: row.agency_email,
      location: row.location,
      status: result.ok ? "sent" : "failed",
      error_message: result.ok ? null : result.error || "Send failed.",
    });

    if (result.ok) {
      sentCount++;
      await admin
        .schema("ops")
        .from("outreach_agencies")
        .update({ sent: true })
        .eq("source_row", row.source_row);
    } else {
      failedCount++;
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount, failed: failedCount, attempted: batch.length });
}

const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JobsOverseas.in</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fb; padding:24px 0;">
<tr>
<td align="center">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px; width:100%; background-color:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e3e7f0;">

<tr>
<td colspan="2" style="background-color:#0a1f4a; padding:18px 24px;">
<span style="font-size:19px; font-weight:bold; color:#ffffff; font-family:Arial, Helvetica, sans-serif;">Jobs<span style="color:#f2861b;">Overseas</span><span style="color:#ffffff; font-weight:normal;">.in</span></span>
</td>
</tr>

<tr>

<!-- LEFT: graphic panel -->
<td width="220" valign="top" style="background-color:#0f2a5e; padding:28px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding-bottom:14px;">
<img src="data:image/png;base64,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" width="132" height="132" alt="JobsOverseas" style="display:block;">
</td></tr>
<tr><td align="center" style="padding-bottom:22px; border-bottom:1px solid #24406e;">
<span style="font-size:14px; color:#9fb3d9; line-height:1.5; font-style:italic;">Connecting Indian agencies to the jobseekers searching the roles.</span>
</td></tr>

<tr><td style="padding-top:22px; padding-bottom:10px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td width="20" valign="top" style="font-size:12px; color:#f2861b; padding:6px 0;">✓</td>
<td style="font-size:12px; color:#dbe4f4; padding:6px 0; line-height:1.4;">Live ad on JobsOverseas.in</td>
</tr>
<tr>
<td width="20" valign="top" style="font-size:12px; color:#f2861b; padding:6px 0;">✓</td>
<td style="font-size:12px; color:#dbe4f4; padding:6px 0; line-height:1.4;">FB &amp; Instagram promo included</td>
</tr>
<tr>
<td width="20" valign="top" style="font-size:12px; color:#f2861b; padding:6px 0;">✓</td>
<td style="font-size:12px; color:#dbe4f4; padding:6px 0; line-height:1.4;">AI-scored, your threshold</td>
</tr>
<tr>
<td width="20" valign="top" style="font-size:12px; color:#f2861b; padding:6px 0;">✓</td>
<td style="font-size:12px; color:#dbe4f4; padding:6px 0; line-height:1.4;">Receive segregated applications as per the role</td>
</tr>
<tr>
<td width="20" valign="top" style="font-size:12px; color:#f2861b; padding:6px 0;">✓</td>
<td style="font-size:12px; color:#dbe4f4; padding:6px 0; line-height:1.4;">Interest &amp; availability confirmed upfront</td>
</tr>
<tr>
<td width="20" valign="top" style="font-size:12px; color:#f2861b; padding:6px 0;">✓</td>
<td style="font-size:12px; color:#dbe4f4; padding:6px 0; line-height:1.4;">Video intro for senior roles</td>
</tr>
</table>
</td></tr>

<tr><td style="padding-top:18px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#d96f0c; border-radius:6px;">
<tr><td align="center" style="padding:14px 10px;">
<span style="display:block; font-size:10.5px; color:#ffe9d1; letter-spacing:0.5px; font-weight:bold;">FIRST POST ONLY</span>
<span style="display:block; font-size:22px; color:#ffffff; font-weight:bold; line-height:1.3;">UP TO 43% OFF</span>
<span style="display:block; font-size:10px; color:#ffe9d1;">25% discount, tax-inclusive</span>
</td></tr>
</table>
</td></tr>

</table>
</td>

<!-- RIGHT: copy -->
<td width="400" valign="top" style="padding:28px 26px;">

<p style="margin:0 0 14px; font-size:15px; color:#0a1f4a; font-weight:bold;">Hi {{Agency Name}} team,</p>

<p style="margin:0 0 14px; font-size:13.5px; line-height:1.6; color:#33415c;">
I'm reaching out from JobsOverseas.in — a platform built specifically for Indian overseas recruitment agencies to reach the desired jobseeker database across India. As {{Agency Name}} is one of the leading Recruiting Agents based in {{Location}}, I wanted to introduce the platform to you directly.
</p>

<p style="margin:0 0 14px; font-size:13.5px; line-height:1.6; color:#33415c;">
Every application comes AI-scored against your job description at the threshold you choose, and confirmed interest &amp; availability for the job location. For senior positions, we have added a short video introduction too for your ease.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f5f7fb; border-radius:8px; margin-bottom:18px; width:100%;">
<tr>
<td style="padding:12px 16px;">
<span style="font-size:13px; color:#33415c;">Posting fee: </span>
<span style="font-size:13px; color:#9aa5b8; text-decoration:line-through;">₹9,999</span>
<span style="font-size:14.5px; font-weight:bold; color:#0a1f4a;"> ₹7,499</span>
<span style="font-size:12px; color:#33415c;"> for your first post — no commission, no recurring fee</span>
</td>
</tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="border-radius:6px; background-color:#f2861b;">
<a href="https://jobsoverseas.in" style="display:inline-block; padding:12px 26px; font-size:13.5px; font-weight:bold; color:#241000; text-decoration:none;">Post your first ad →</a>
</td>
</tr>
</table>

<p style="margin:18px 0 4px; font-size:13px; color:#33415c;">Happy to answer any questions by reply or phone.</p>

<p style="margin:18px 0 0; font-size:13px; color:#0a1f4a; line-height:1.6;">
Best regards,<br>
<span style="font-size:15px; font-weight:bold; color:#0a1f4a;">Mohsin Pasha</span><br>
JobsOverseas.in<br>
<a href="mailto:mohsin@intercorpservices.in" style="color:#2c4d94;">mohsin@intercorpservices.in</a><br>
+91 88844 78676<br>
Support: <a href="mailto:support@jobsoverseas.in" style="color:#2c4d94;">support@jobsoverseas.in</a>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td colspan="2" style="background-color:#f5f7fb; padding:14px 24px; text-align:center; border-top:1px solid #e3e7f0;">
<span style="font-size:11px; color:#9aa5b8;">JobsOverseas.in — connecting Indian recruitment agencies to Gulf &amp; overseas placements.</span>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`;
