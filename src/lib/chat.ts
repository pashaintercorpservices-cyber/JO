import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type ChatOutcome = { reply: string; status: "ongoing" | "resolved" | "escalated" };

const RESOLVED_MARKER = "[[RESOLVED]]";
const ESCALATE_MARKER = "[[ESCALATE]]";

/** Pulls a compact, real-data snapshot to ground the model -- live ad counts by country
 * plus a keyword-matched slice of live ads relevant to the visitor's message, using the
 * same .ilike search approach as the homepage. Never invents inventory. */
async function getSiteContext(message: string): Promise<string> {
  const admin = createAdminClient();

  const { data: liveAds } = await admin.from("job_ads").select("country").eq("status", "live");
  const countryCounts = new Map<string, number>();
  (liveAds || []).forEach((a) => countryCounts.set(a.country, (countryCounts.get(a.country) || 0) + 1));
  const countrySummary = [...countryCounts.entries()]
    .map(([country, count]) => `${country}: ${count} live ad(s)`)
    .join(", ");

  const safeQ = message.replace(/[,()]/g, " ").trim().slice(0, 100);
  const likeQ = `%${safeQ}%`;
  let relevantAds: { title: string; country: string; city: string | null; employer_name: string | null }[] = [];
  if (safeQ) {
    const { data: matches } = await admin
      .from("job_ads")
      .select("title, country, city, employer_name")
      .eq("status", "live")
      .or(`title.ilike.${likeQ},description.ilike.${likeQ},employer_name.ilike.${likeQ},city.ilike.${likeQ},country.ilike.${likeQ}`)
      .limit(8);
    relevantAds = matches || [];
  }

  const adsBlock = relevantAds.length
    ? relevantAds
        .map((a) => `- ${a.title} — ${a.city ? `${a.city}, ` : ""}${a.country}${a.employer_name ? ` (${a.employer_name})` : ""}`)
        .join("\n")
    : "(no live ads matched keywords from this message -- do not invent any)";

  return `Live ad counts by country: ${countrySummary || "no live ads currently"}.

Live ads possibly relevant to this message:
${adsBlock}

Platform facts (always true, use freely):
- JobsOverseas.in connects licensed overseas recruitment agencies with candidates across India.
- Candidates apply directly on an ad's page, free, no account required, guest or logged-in.
- Agencies post a vacancy for a flat fee (normally Rs. 9,999, 25% off first post) which includes
  a disclosed FB/Instagram promotion perk (Rs. 1,500 budget, 2 days).
- Support contact: support@jobsoverseas.in, WhatsApp/phone +91 88844 78676.`;
}

function buildSystemPrompt(visitorType: string | undefined, siteContext: string): string {
  return `You are the JobsOverseas.in live support chat assistant. JobsOverseas is a platform connecting Indian jobseekers with overseas (mostly Gulf) recruitment agencies. You are talking to a ${visitorType === "agency" ? "recruitment agency" : visitorType === "jobseeker" ? "jobseeker" : "visitor"}.

Real, current site data for this conversation -- use ONLY this for any factual claim about live vacancies, counts, or specific ads. Never invent a job, a count, or a detail not present here:
${siteContext}

Rules:
- Be concise, warm, and specific. Reference real ad details from the data above when relevant.
- If a jobseeker asks about vacancies you have no matching data for, say so honestly and suggest browsing the homepage or trying different keywords -- never invent a listing.
- If the visitor's question is about something you cannot resolve with the information above (a specific application status, a payment issue, a complaint, anything needing a human), do NOT guess -- say you're flagging this for the support team.
- End EVERY reply with exactly one of these two literal markers on its own final line, and nothing after it:
  ${RESOLVED_MARKER} -- if this message fully answers/settles what the visitor needed
  ${ESCALATE_MARKER} -- if you cannot confidently help, or the visitor asks for a human/support/call
  If the conversation is clearly still ongoing (you asked a clarifying question, more back-and-forth is expected), end with neither marker.`;
}

function stripMarker(text: string): { reply: string; status: ChatOutcome["status"] } {
  const trimmed = text.trim();
  if (trimmed.endsWith(RESOLVED_MARKER)) {
    return { reply: trimmed.slice(0, -RESOLVED_MARKER.length).trim(), status: "resolved" };
  }
  if (trimmed.endsWith(ESCALATE_MARKER)) {
    return { reply: trimmed.slice(0, -ESCALATE_MARKER.length).trim(), status: "escalated" };
  }
  return { reply: trimmed, status: "ongoing" };
}

/** Calls Gemini with the conversation history plus real site-data context -- same
 * header-auth pattern as scoreWithGemini in src/lib/matching.ts, reusing GEMINI_API_KEY. */
export async function chatWithGemini(
  history: ChatTurn[],
  visitorType: string | undefined,
  latestMessage: string
): Promise<ChatOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply: "Live chat support isn't configured right now -- please reach us at support@jobsoverseas.in or WhatsApp +91 88844 78676.",
      status: "escalated",
    };
  }

  const siteContext = await getSiteContext(latestMessage);
  const systemPrompt = buildSystemPrompt(visitorType, siteContext);

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood, I'll follow those rules." }] },
    ...history.map((turn) => ({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.content }],
    })),
    { role: "user", parts: [{ text: latestMessage }] },
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 500, thinkingConfig: { thinkingLevel: "low" } },
        }),
      }
    );

    if (!res.ok) {
      console.error("[chat:gemini-failed]", res.status, await res.text());
      return {
        reply: "I'm having trouble right now -- I've flagged this for our support team, or reach us directly at support@jobsoverseas.in / +91 88844 78676.",
        status: "escalated",
      };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return {
        reply: "I'm having trouble right now -- I've flagged this for our support team, or reach us directly at support@jobsoverseas.in / +91 88844 78676.",
        status: "escalated",
      };
    }

    return stripMarker(text);
  } catch (err) {
    console.error("[chat:gemini-error]", err);
    return {
      reply: "I'm having trouble right now -- I've flagged this for our support team, or reach us directly at support@jobsoverseas.in / +91 88844 78676.",
      status: "escalated",
    };
  }
}

/** Summarizes a chat transcript into a short subject + summary for a support ticket --
 * used for both the escalation handoff (WhatsApp link) and the internal ticket record. */
export async function summarizeChatForTicket(history: ChatTurn[]): Promise<{ subject: string; summary: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const transcript = history.map((t) => `${t.role === "user" ? "Visitor" : "Assistant"}: ${t.content}`).join("\n");

  if (!apiKey) {
    return { subject: "Support chat", summary: transcript.slice(0, 500) };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Summarize this JobsOverseas.in support chat for an internal ticket. Respond with ONLY valid JSON, no other text: {"subject": "<under 10 words>", "summary": "<2-4 sentences, what the visitor needs>"}\n\nTranscript:\n${transcript}`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 600, thinkingConfig: { thinkingLevel: "low" } },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("empty response");
    let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    // Model output occasionally gets truncated mid-string (finishReason MAX_TOKENS) despite
    // the raised budget above -- salvage a usable object from a truncated tail rather than
    // falling all the way back to the raw-transcript summary.
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace === -1) cleaned += '"}';
    else if (lastBrace < cleaned.length - 1) cleaned = cleaned.slice(0, lastBrace + 1);
    const parsed = JSON.parse(cleaned);
    return {
      subject: String(parsed.subject || "Support chat").slice(0, 200),
      summary: String(parsed.summary || transcript.slice(0, 500)).slice(0, 1000),
    };
  } catch (err) {
    console.error("[chat:summarize-error]", err);
    return { subject: "Support chat", summary: transcript.slice(0, 500) };
  }
}
