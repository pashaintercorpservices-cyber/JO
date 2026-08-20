import "server-only";
import { Resend } from "resend";

const SITE_URL = "https://jobsoverseas.vercel.app";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmailHtml(bodyHtml: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f9; padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center" style="background:#0a1f4a; padding:22px 24px;">
            <a href="${SITE_URL}" style="text-decoration:none;">
              <img src="${SITE_URL}/logo-icon-light.png" width="40" height="40" alt="JobsOverseas.in" style="display:block; margin:0 auto 8px;">
              <span style="font-size:22px; font-weight:bold; color:#ffffff;">Jobs<span style="color:#f2861b;">Overseas</span>.in</span>
            </a>
            <div style="font-size:12px; color:#c9d3ea; margin-top:4px;">Advertise the job. Track the hire.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px; color:#1a2233; font-size:14px; line-height:1.6;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="background:#0a1f4a; padding:16px 24px; font-size:11px; color:#c9d3ea;">
            JobsOverseas.in &middot; Advertising platform for licensed overseas recruitment agencies<br>
            <a href="${SITE_URL}" style="color:#f2861b;">${SITE_URL.replace("https://", "")}</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
  `;
}

async function sendEmail(params: { to: string; subject: string; text: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "JobsOverseas <noreply@jobsoverseas.example>";

  if (!apiKey) {
    console.log("[email:mock]", { to: params.to, subject: params.subject, text: params.text });
    return;
  }

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
  if (sendError) {
    console.error("[email:failed]", { to: params.to, subject: params.subject, error: sendError });
  }
}

export async function sendApplicationEmail(params: {
  to: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  positionTitle: string;
  resumeUrl?: string;
  suitabilityAnswer?: string;
}) {
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
    ...(params.suitabilityAnswer
      ? ["", `Why the candidate feels suitable: ${params.suitabilityAnswer}`]
      : []),
    "",
    "Should you wish to proceed with the candidate, please feel free to communicate with the candidate directly.",
    "",
    "Best regards,",
    "Team - JobsOverseas.in",
  ].join("\n");
  const html = wrapEmailHtml(`
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
    ${
      params.suitabilityAnswer
        ? `<p style="margin:0 0 16px; padding:14px 16px; background:#eef2f9; border-radius:8px;"><strong>Why the candidate feels suitable:</strong><br>${escapeHtml(params.suitabilityAnswer)}</p>`
        : ""
    }
    <p style="margin:0 0 16px;">Should you wish to proceed with the candidate, please feel free to communicate with the candidate directly.</p>
    <p style="margin:0;">Best regards,<br>Team - JobsOverseas.in</p>
  `);

  await sendEmail({ to: params.to, subject, text, html });
}

export async function sendCandidateConfirmationEmail(params: {
  to: string;
  applicantName: string;
  positionTitle: string;
  employerName?: string | null;
  hasResume: boolean;
  contactName?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
}) {
  const subject = `Your application for ${params.positionTitle} has been received | JobsOverseas.in`;
  const employerLine = params.employerName ? ` at ${params.employerName}` : "";
  const resumeLine = params.hasResume
    ? "We have shared your resume with the advertising agency directly."
    : "We have shared your application details with the advertising agency directly.";

  const contactLines = [
    params.contactName ? `Hiring Manager: ${params.contactName}` : null,
    `Email: ${params.contactEmail}`,
    params.contactPhone ? `Phone: ${params.contactPhone}` : null,
  ].filter((line): line is string => Boolean(line));

  const text = [
    `Dear ${params.applicantName},`,
    "",
    `Thank you for applying for the position of ${params.positionTitle}${employerLine} through JobsOverseas.in.`,
    "",
    resumeLine,
    "",
    "If you have any questions or need further information about this vacancy, please feel free to reach out to the hiring manager directly using the details below:",
    "",
    ...contactLines,
    "",
    "We wish you the very best for your application.",
    "",
    "Best regards,",
    "Team - JobsOverseas.in",
  ].join("\n");

  const html = wrapEmailHtml(`
    <p style="margin:0 0 16px;">Dear ${escapeHtml(params.applicantName)},</p>
    <p style="margin:0 0 16px;">Thank you for applying for the position of <strong>${escapeHtml(params.positionTitle)}</strong>${employerLine ? ` at <strong>${escapeHtml(params.employerName!)}</strong>` : ""} through JobsOverseas.in.</p>
    <p style="margin:0 0 16px;">${escapeHtml(resumeLine)}</p>
    <p style="margin:0 0 8px;">If you have any questions or need further information about this vacancy, please feel free to reach out to the hiring manager directly using the details below:</p>
    <p style="margin:0 0 16px; padding:14px 16px; background:#eef2f9; border-radius:8px;">
      ${
        params.contactName
          ? `<strong>Hiring Manager:</strong> ${escapeHtml(params.contactName)}<br>`
          : ""
      }
      <strong>Email:</strong> <a href="mailto:${escapeHtml(params.contactEmail)}" style="color:#0a1f4a;">${escapeHtml(params.contactEmail)}</a>
      ${
        params.contactPhone
          ? `<br><strong>Phone:</strong> ${escapeHtml(params.contactPhone)}`
          : ""
      }
    </p>
    <p style="margin:0 0 16px;">We wish you the very best for your application.</p>
    <p style="margin:0;">Best regards,<br>Team - JobsOverseas.in</p>
  `);

  await sendEmail({ to: params.to, subject, text, html });
}
