import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSupportReplyEmail } from "@/lib/email";

/**
 * Sends a human-drafted, human-approved support ticket reply. Mirrors
 * api/admin/outreach/send-batch/route.ts's token-gate pattern exactly. Called by the ops
 * dashboard's "Send this reply" button once the owner has approved the draft in Approvals --
 * this route is the only thing that actually sends the email and marks the ticket resolved.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { token, ticketId, subject, body: replyBody } = body as {
    token?: string;
    ticketId?: string;
    subject?: string;
    body?: string;
  };

  if (!token || !ticketId || !subject || !replyBody) {
    return NextResponse.json({ error: "Missing token, ticketId, subject, or body." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .schema("ops")
    .from("admin_api_tokens")
    .select("token")
    .eq("token", token)
    .eq("purpose", "support_ticket_reply_send")
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  await admin
    .schema("ops")
    .from("admin_api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id, email")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  if (!ticket.email) {
    return NextResponse.json({ error: "This ticket has no email on file to reply to." }, { status: 400 });
  }

  const result = await sendSupportReplyEmail({ to: ticket.email, subject, body: replyBody });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Send failed." }, { status: 500 });
  }

  await admin.from("support_ticket_replies").insert({
    ticket_id: ticketId,
    sender: "support_team",
    body: replyBody,
  });

  await admin
    .from("support_tickets")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", ticketId);

  return NextResponse.json({ ok: true });
}
