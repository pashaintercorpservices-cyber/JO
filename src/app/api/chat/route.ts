import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatWithGemini, summarizeChatForTicket, type ChatTurn } from "@/lib/chat";
import { sendSupportReplyEmail } from "@/lib/email";

const WHATSAPP_NUMBER = "918884478676";

/**
 * Public, unauthenticated chat endpoint. The widget never talks to Supabase directly --
 * every read/write goes through this route using the admin client, so chat_sessions/
 * chat_messages/support_tickets stay service-role-only (no anon RLS policy needed).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, visitorType, name, email, phone, message } = body as {
    sessionId?: string;
    visitorType?: "agency" | "jobseeker";
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }

  const admin = createAdminClient();

  let session: { id: string } | null = null;

  if (sessionId) {
    const { data } = await admin.from("chat_sessions").select("id").eq("id", sessionId).maybeSingle();
    session = data;
  }

  if (!session) {
    const { data: created, error: createError } = await admin
      .from("chat_sessions")
      .insert({ visitor_type: visitorType, name, email, phone })
      .select("id")
      .single();
    if (createError || !created) {
      return NextResponse.json({ error: createError?.message || "Could not start chat session." }, { status: 500 });
    }
    session = created;
  } else if (name || email || phone) {
    // Contact details can arrive after the session already exists (widget collects them
    // once, up front) -- keep the row current rather than requiring a fresh session.
    await admin
      .from("chat_sessions")
      .update({ visitor_type: visitorType, name, email, phone })
      .eq("id", session.id);
  }

  const { data: priorMessages } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const history: ChatTurn[] = (priorMessages || []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  await admin.from("chat_messages").insert({ session_id: session.id, role: "user", content: message });
  await admin.from("chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", session.id);

  const fullHistory = [...history, { role: "user" as const, content: message }];
  const outcome = await chatWithGemini(history, visitorType, message, email);

  await admin.from("chat_messages").insert({ session_id: session.id, role: "assistant", content: outcome.reply });

  const responseHistory: ChatTurn[] = [...fullHistory, { role: "assistant", content: outcome.reply }];

  if (outcome.status === "escalated") {
    const { subject, summary } = await summarizeChatForTicket(responseHistory);
    const { data: ticket } = await admin
      .from("support_tickets")
      .insert({
        session_id: session.id,
        visitor_type: visitorType,
        name,
        email,
        phone,
        subject,
        chat_summary: summary,
        status: "escalated",
      })
      .select("id")
      .single();

    const waText = encodeURIComponent(
      `Hi, I need help with: ${subject}\n\n${summary}\n\n(via JobsOverseas.in chat${ticket ? `, ticket ${ticket.id}` : ""})`
    );

    return NextResponse.json({
      sessionId: session.id,
      reply: outcome.reply,
      status: outcome.status,
      whatsappLink: `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`,
    });
  }

  if (outcome.status === "resolved" && email) {
    const { subject, summary } = await summarizeChatForTicket(responseHistory);
    const { data: ticket } = await admin
      .from("support_tickets")
      .insert({
        session_id: session.id,
        visitor_type: visitorType,
        name,
        email,
        phone,
        subject,
        chat_summary: summary,
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const transcript = responseHistory
      .map((t) => `${t.role === "user" ? (name || "You") : "JobsOverseas Support"}: ${t.content}`)
      .join("\n\n");
    const emailBody = `Hi ${name || "there"},\n\nHere's a copy of your support conversation with JobsOverseas.in for your records:\n\n${transcript}\n\nIf this didn't fully solve it, just reply to this email or WhatsApp us at +91 88844 78676.`;

    const sendResult = await sendSupportReplyEmail({
      to: email,
      subject: `Your JobsOverseas.in support conversation: ${subject}`,
      body: emailBody,
    });

    if (ticket) {
      await admin.from("support_ticket_replies").insert({
        ticket_id: ticket.id,
        sender: "ai_auto",
        body: emailBody,
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      reply: outcome.reply,
      status: outcome.status,
      emailSent: sendResult.ok,
    });
  }

  return NextResponse.json({ sessionId: session.id, reply: outcome.reply, status: outcome.status });
}
