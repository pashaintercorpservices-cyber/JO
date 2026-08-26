import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Token-gated write endpoint for the SEO Expert's daily automated check (a scheduled cloud
 * routine, no interactive session). Mirrors api/admin/support/send-reply/route.ts's token-gate
 * pattern -- validates against ops.admin_api_tokens, then inserts a real ops.reports row (visible
 * on the ops dashboard's SEO Expert tab / Reports page) plus an ops.activity_log entry.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { token, summary, details, recommendations } = body as {
    token?: string;
    summary?: string;
    details?: Record<string, unknown>;
    recommendations?: string[];
  };

  if (!token || !summary) {
    return NextResponse.json({ error: "Missing token or summary." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .schema("ops")
    .from("admin_api_tokens")
    .select("token")
    .eq("token", token)
    .eq("purpose", "seo_daily_report_write")
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  await admin
    .schema("ops")
    .from("admin_api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  const { data: role, error: roleError } = await admin
    .schema("ops")
    .from("roles")
    .select("id")
    .eq("subagent_name", "seo-expert")
    .maybeSingle();

  if (roleError || !role) {
    return NextResponse.json({ error: "SEO Expert role not found in ops.roles." }, { status: 500 });
  }

  const { data: report, error: reportError } = await admin
    .schema("ops")
    .from("reports")
    .insert({
      role_id: role.id,
      summary,
      details: details ?? null,
      recommendations: recommendations ?? null,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: reportError?.message || "Failed to write report." }, { status: 500 });
  }

  await admin.schema("ops").from("activity_log").insert({
    role_id: role.id,
    action: "ran_report",
    entity_type: "report",
    entity_id: report.id,
  });

  return NextResponse.json({ ok: true, reportId: report.id });
}
