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

export async function scoreResumeMatch(params: {
  resumeText: string;
  positionTitle: string;
  jobDetails: string;
}): Promise<MatchResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("[matching:skip] ANTHROPIC_API_KEY not set -- skipping match scoring");
    return null;
  }
  if (!params.resumeText.trim()) return null;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are evaluating how well a candidate's resume matches a job vacancy for an overseas recruitment platform.

Job title: ${params.positionTitle}
Job requirements: ${params.jobDetails || "(no additional details provided)"}

Resume text:
"""
${params.resumeText}
"""

Score how well this candidate's actual experience and skills align with the job requirements, from 0-100. Be honest and realistic -- most resumes are a partial match, not a perfect one. Respond with ONLY valid JSON, no other text, in exactly this format:
{"score": <integer 0-100>, "summary": "<one sentence, under 20 words, explaining the score>"}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const parsed = JSON.parse(textBlock.text.trim());
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
    if (Number.isNaN(score)) return null;

    return { score, summary: String(parsed.summary || "").slice(0, 300) };
  } catch (err) {
    console.error("[matching:score-failed]", err);
    return null;
  }
}
