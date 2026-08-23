import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type MatchResult = { score: number; summary: string };
export type ProviderOutcome = { result: MatchResult | null; error: string | null };
export type ScoringResult = {
  score: number | null;
  summary: string | null;
  provider: "gemini" | "gemini-vision" | "claude" | null;
  error: string | null;
};

// Below this many characters, extracted text is almost certainly noise (a stray
// header, whitespace) rather than a real resume body -- not worth scoring against.
const MIN_USABLE_TEXT_LENGTH = 40;
// Gemini's inline-data request body has a practical size ceiling well under the
// bucket's 100MB upload limit -- skip the vision fallback past this rather than
// send a request that's certain to be rejected.
const MAX_VISION_PDF_BYTES = 15 * 1024 * 1024;

/** Best-effort text extraction from a resume file. Returns "" (not an error) for
 * formats we can't parse (legacy .doc) or on any extraction failure -- scoring is a
 * nice-to-have and must never block the actual application submission. */
export async function extractResumeText(bytes: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  try {
    if (lower.endsWith(".pdf")) {
      // unpdf ships a serverless build of PDF.js with no native canvas dependency --
      // pdf-parse's default pdfjs-dist build needs DOMMatrix/canvas that Vercel's
      // serverless runtime doesn't provide, which silently broke extraction there.
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const result = await extractText(pdf, { mergePages: true });
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

/** Runs `attempt` up to twice -- most scoring failures are transient (rate limit, cold
 * network blip, an occasional malformed-JSON response), and a single retry clears the
 * large majority of them without meaningfully slowing down the submission path. */
async function withRetry<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch (err) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      return await attempt();
    } catch {
      throw err; // surface the first error -- more representative than a second identical failure
    }
  }
}

async function scoreWithGemini(prompt: string): Promise<ProviderOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { result: null, error: "gemini:no_key" };

  try {
    return await withRetry(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
        {
          method: "POST",
          // Header-based auth rather than a `?key=` query param -- keeps the key out of
          // request URLs that might otherwise land in intermediary/proxy access logs.
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            // maxOutputTokens must cover thinking tokens too, not just the JSON reply, or the
            // response gets cut off mid-JSON. thinkingLevel "low" keeps thinking (and latency) down.
            generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingLevel: "low" } },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        console.error("[matching:gemini-failed]", res.status, body);
        throw new Error(`gemini:http_${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("gemini:empty_response");

      const parsed = parseResult(text);
      if (!parsed) throw new Error("gemini:unparseable_response");
      return { result: parsed, error: null };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "gemini:unknown_error";
    console.error("[matching:gemini-error]", message);
    return { result: null, error: message };
  }
}

/** Falls back to sending the raw PDF to Gemini directly when text extraction comes
 * back empty -- covers scanned/photographed resumes with no embedded text layer,
 * which is common on this platform's candidate base. Gemini understands PDF content
 * (including scanned pages) natively, so this needs no separate OCR/rendering step
 * -- and specifically avoids re-adding any page-rasterization/canvas dependency,
 * which is exactly what broke text extraction in serverless before (see
 * extractResumeText's unpdf comment). */
async function scoreWithGeminiVision(pdfBytes: Buffer, prompt: string): Promise<ProviderOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { result: null, error: "gemini:no_key" };

  try {
    return await withRetry(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "application/pdf", data: pdfBytes.toString("base64") } },
                ],
              },
            ],
            generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingLevel: "low" } },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        console.error("[matching:gemini-vision-failed]", res.status, body);
        throw new Error(`gemini:vision_http_${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("gemini:vision_empty_response");

      const parsed = parseResult(text);
      if (!parsed) throw new Error("gemini:vision_unparseable_response");
      return { result: parsed, error: null };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "gemini:vision_unknown_error";
    console.error("[matching:gemini-vision-error]", message);
    return { result: null, error: message };
  }
}

async function scoreWithClaude(prompt: string): Promise<ProviderOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { result: null, error: "claude:no_key" };

  try {
    return await withRetry(async () => {
      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("claude:empty_response");

      const parsed = parseResult(textBlock.text);
      if (!parsed) throw new Error("claude:unparseable_response");
      return { result: parsed, error: null };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "claude:unknown_error";
    console.error("[matching:claude-error]", message);
    return { result: null, error: `claude:${message}` };
  }
}

/** Scores a resume against a job description, trying Gemini first (free tier -- works
 * without any billing setup) then falling back to Claude. Never throws -- every failure
 * mode is reported back in `.error` instead, so callers can persist *why* scoring didn't
 * happen rather than just recording a silent null. */
export async function scoreResumeMatch(params: {
  resumeText: string;
  positionTitle: string;
  jobDetails: string;
  /** Raw file bytes + name -- only used for the vision fallback when text extraction
   * comes back too thin to score. Omit if unavailable; scoring just stays text-only. */
  resumeBytes?: Buffer;
  resumeFileName?: string;
}): Promise<ScoringResult> {
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log("[matching:skip] No GEMINI_API_KEY or ANTHROPIC_API_KEY set -- skipping match scoring");
    return { score: null, summary: null, provider: null, error: "config:no_provider_key" };
  }

  const hasUsableText = params.resumeText.trim().length >= MIN_USABLE_TEXT_LENGTH;

  if (!hasUsableText) {
    const isPdf = (params.resumeFileName || "").toLowerCase().endsWith(".pdf");
    const bytes = params.resumeBytes;
    const withinSizeLimit = !!bytes && bytes.length > 0 && bytes.length <= MAX_VISION_PDF_BYTES;

    if (!isPdf || !bytes || !withinSizeLimit) {
      return {
        score: null,
        summary: null,
        provider: null,
        error: params.resumeText.trim() ? "extraction:text_too_short" : "extraction:empty_text",
      };
    }

    // No text layer -- almost always a scanned/photographed resume. Send the PDF to
    // Gemini directly rather than giving up; it reads scanned pages natively.
    const visionPrompt = buildPrompt({
      ...params,
      resumeText: "(no extractable text layer -- read the attached scanned resume document directly)",
    });
    const vision = await scoreWithGeminiVision(bytes, visionPrompt);
    if (vision.result) {
      return { score: vision.result.score, summary: vision.result.summary, provider: "gemini-vision", error: null };
    }
    return { score: null, summary: null, provider: null, error: vision.error ?? "gemini:vision_unknown_error" };
  }

  const prompt = buildPrompt(params);

  const gemini = await scoreWithGemini(prompt);
  if (gemini.result) {
    return { score: gemini.result.score, summary: gemini.result.summary, provider: "gemini", error: null };
  }

  const claude = await scoreWithClaude(prompt);
  if (claude.result) {
    return { score: claude.result.score, summary: claude.result.summary, provider: "claude", error: null };
  }

  return {
    score: null,
    summary: null,
    provider: null,
    error: `${gemini.error ?? "gemini:unknown_error"}|${claude.error ?? "claude:unknown_error"}`,
  };
}

/** Runs both providers independently (no early-return-on-first-success) against a fixed
 * test case, for the admin diagnostics endpoint -- lets a config problem be confirmed in
 * one request instead of waiting on a real application and guessing from logs. */
export async function diagnoseScoring(): Promise<{ gemini: ProviderOutcome; claude: ProviderOutcome }> {
  const prompt = buildPrompt({
    resumeText:
      "Rajesh Kumar. 6 years experience as a MIG/TIG welder in structural steel fabrication, UAE and Saudi Arabia. ITI certified, safety training current.",
    positionTitle: "MIG Welder",
    jobDetails: "Structural steel fabrication, Jebel Ali. Minimum 3 years MIG welding experience required.",
  });

  const [gemini, claude] = await Promise.all([scoreWithGemini(prompt), scoreWithClaude(prompt)]);
  return { gemini, claude };
}
