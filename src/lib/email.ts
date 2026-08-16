import "server-only";
import { Resend } from "resend";

export async function sendApplicationEmail(params: {
  to: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  positionTitle: string;
  resumeUrl?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "JobsOverseas <noreply@jobsoverseas.example>";
  const subject = `New application: ${params.positionTitle}`;
  const text = [
    "New application received via JobsOverseas.",
    "",
    `Position: ${params.positionTitle}`,
    `Name: ${params.applicantName}`,
    `Email: ${params.applicantEmail}`,
    `Phone: ${params.applicantPhone}`,
    params.resumeUrl ? `Resume: ${params.resumeUrl}` : "Resume: not attached",
  ].join("\n");

  if (!apiKey) {
    console.log("[email:mock]", { to: params.to, subject, text });
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to: params.to, subject, text });
}
