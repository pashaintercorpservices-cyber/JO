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
  const subject = `Application: ${params.applicantName} - ${params.positionTitle} | JobsOverseas.in`;
  const text = [
    "Dear Sir/Madam,",
    "",
    "Greetings from JobsOverseas.in.",
    "",
    "Please find below the details of a candidate who has applied for your vacancy through JobsOverseas.in.",
    "",
    `Candidate Name: ${params.applicantName}`,
    `Email: ${params.applicantEmail}`,
    `Phone: ${params.applicantPhone}`,
    "",
    params.resumeUrl
      ? `Resume: Please access the candidate's CV through the link below.\n${params.resumeUrl}`
      : "Resume: not attached",
    "",
    "Should you wish to proceed with the candidate, please feel free to communicate with the candidate directly.",
    "",
    "Best regards,",
    "Team - JobsOverseas.in",
  ].join("\n");
  const siteUrl = "https://jobsoverseas.vercel.app";
  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f9; padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center" style="background:#0a1f4a; padding:22px 24px;">
            <a href="${siteUrl}" style="text-decoration:none;">
              <img src="${siteUrl}/logo-icon-light.png" width="40" height="40" alt="JobsOverseas.in" style="display:block; margin:0 auto 8px;">
              <span style="font-size:22px; font-weight:bold; color:#ffffff;">Jobs<span style="color:#f2861b;">Overseas</span>.in</span>
            </a>
            <div style="font-size:12px; color:#c9d3ea; margin-top:4px;">Advertise the job. Track the hire.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px; color:#1a2233; font-size:14px; line-height:1.6;">
            <p style="margin:0 0 16px;">Dear Sir/Madam,</p>
            <p style="margin:0 0 16px;">Greetings from JobsOverseas.in.</p>
            <p style="margin:0 0 16px;">Please find below the details of a candidate who has applied for your vacancy through JobsOverseas.in.</p>
            <p style="margin:0 0 16px;">
              <strong>Candidate Name:</strong> ${escapeHtml(params.applicantName)}<br>
              <strong>Email:</strong> ${escapeHtml(params.applicantEmail)}<br>
              <strong>Phone:</strong> ${escapeHtml(params.applicantPhone)}
            </p>
            <p style="margin:0 0 16px;">${
              params.resumeUrl
                ? `<a href="${escapeHtml(params.resumeUrl)}" style="display:inline-block; background:#f2861b; color:#241000; font-weight:bold; text-decoration:none; padding:10px 18px; border-radius:6px;">View Candidate Resume</a>`
                : "Resume: not attached"
            }</p>
            <p style="margin:0 0 16px;">Should you wish to proceed with the candidate, please feel free to communicate with the candidate directly.</p>
            <p style="margin:0;">Best regards,<br>Team - JobsOverseas.in</p>
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
