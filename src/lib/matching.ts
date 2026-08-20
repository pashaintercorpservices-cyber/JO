import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type MatchResult = { score: number; summary: string };

/** Best-effort text extraction from a resume file. Returns "" (not an error) for
 * formats we can't parse (legacy .doc) or on any extraction failure -- scoring is a
 * nice-to-have and must never block the actual application submission. */
export async function extractResumeText(bytes: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  try {
    if (lower.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: bytes });
      const result = await parser.getText();
      await parser.destroy();
      return result.text.slice(0, 15000);
    }
    if (lower.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: bytes });
      return result.value.slice(0, 15000);
    }
    // Legacy .doc has no reliable pure-JS text extraction -- skip scoring for it.
    return "";
  } catch (err) {
    console.error("[matching:extract-failed]", fileName, err);
    return "";
  }
}

function buildPrompt(params: { resumeText: string; positionTitle: string; jobDetails: string }): string {
  return `You are evaluating how well a candidate's resume matches a job vacancy for an overseas recruitment platform.

Job title: ${params.positionTitle}
Job requirements: ${params.jobDetails || "(no additional details provided)"}

Resume text:
"""
${params.resumeText}
"""

Score how well this candidate's actual experience and skills align with the job requirements, from 0-100. Be honest and realistic -- most resumes are a partial match, not a perfect one. Respond with ONLY valid JSON, no other text, in exactly this format:
{"score": <integer 0-100>, "summary": "<one sentence, under 20 words, explaining the score>"}`;
}

function parseResult(text: string): MatchResult | null {
  // Models sometimes wrap JSON in a markdown code fence despite instructions not to.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(cleaned.trim());
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
  if (Number.isNaN(score)) return null;
  return { score, summary: String(parsed.summary || "").slice(0, 300) };
}

// Free tier -- tried first so scoring works without any billing setup.
async function scoreWithGemini(prompt: string): Promise<MatchResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // maxOutputTokens must cover thinking tokens too, not just the JSON reply, or the
        // response gets cut off mid-JSON. thinkingLevel "low" keeps thinking (and latency) down.
        generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingLevel: "low" } },
      }),
    }
  );

  if (!res.ok) {
    console.error("[matching:gemini-failed]", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  return parseResult(text);
}

// Paid -- used only if Gemini isn't configured (or fails) and an Anthropic key exists.
async function scoreWithClaude(prompt: string): Promise<MatchResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  return parseResult(textBlock.text);
}

export async function scoreResumeMatch(params: {
  resumeText: string;
  positionTitle: string;
  jobDetails: string;
}): Promise<MatchResult | null> {
  if (!params.resumeText.trim()) return null;
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log("[matching:skip] No GEMINI_API_KEY or ANTHROPIC_API_KEY set -- skipping match scoring");
    return null;
  }

  const prompt = buildPrompt(params);

  try {
    const geminiResult = await scoreWithGemini(prompt);
    if (geminiResult) return geminiResult;
  } catch (err) {
    console.error("[matching:gemini-error]", err);
  }

  try {
    return await scoreWithClaude(prompt);
  } catch (err) {
    console.error("[matching:claude-error]", err);
    return null;
  }
}
