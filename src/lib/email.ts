import "server-only";
import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  const siteUrl = "https://jobsoverseas.vercel.app";
  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f9; padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center" style="background:#0a1f4a; padding:22px 24px;">
            <a href="${siteUrl}" style="text-decoration:none;">
              <span style="font-size:22px; font-weight:bold; color:#ffffff;">Jobs<span style="color:#f2861b;">Overseas</span>.in</span>
            </a>
            <div style="font-size:12px; color:#c9d3ea; margin-top:4px;">Advertise the job. Track the hire.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px; color:#1a2233; font-size:14px; line-height:1.6;">
            <p style="margin:0 0 16px;">New application received via JobsOverseas.</p>
            <p style="margin:0 0 16px;">
              <strong>Position:</strong> ${escapeHtml(params.positionTitle)}<br>
              <strong>Name:</strong> ${escapeHtml(params.applicantName)}<br>
              <strong>Email:</strong> ${escapeHtml(params.applicantEmail)}<br>
              <strong>Phone:</strong> ${escapeHtml(params.applicantPhone)}
            </p>
            <p style="margin:0;">${
              params.resumeUrl
                ? `<a href="${escapeHtml(params.resumeUrl)}" style="display:inline-block; background:#f2861b; color:#241000; font-weight:bold; text-decoration:none; padding:10px 18px; border-radius:6px;">Download resume</a>`
                : "Resume: not attached"
            }</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background:#0a1f4a; padding:16px 24px; font-size:11px; color:#c9d3ea;">
            JobsOverseas.in &middot; Advertising platform for licensed overseas recruitment agencies<br>
            <a href="${siteUrl}" style="color:#f2861b;">${siteUrl.replace("https://", "")}</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
  `;

  if (!apiKey) {
    console.log("[email:mock]", { to: params.to, subject, text });
    return;
  }

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({ from, to: params.to, subject, text, html });
  if (sendError) {
    console.error("[email:failed]", { to: params.to, subject, error: sendError });
  }
}
