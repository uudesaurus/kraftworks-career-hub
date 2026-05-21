const RESEND_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Kraftworks <career@kraftworks.app>';
const APP_URL = 'https://career.kraftworks.app';
const HIRING_URL = 'https://hiring.kraftworks.app';

// ── Design System ──────────────────────────────────────
const BRAND = {
  primary: '#2563eb',    // Kraftworks blue
  primaryDark: '#1e40af',
  primaryLight: '#eff6ff',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  teal: '#0891b2',
  tealLight: '#ecfeff',
  dark: '#1e293b',
  text: '#1a1a1a',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Full HTML email wrapper with Kraftworks header + footer
function emailTemplate(params: {
  preheader?: string;
  headline: string;
  body: string;
  ctaUrl?: string;
  ctaText?: string;
  ctaSecondaryUrl?: string;
  ctaSecondaryText?: string;
  footerNote?: string;
  accentColor?: string;
}): string {
  const {
    preheader = '',
    headline,
    body,
    ctaUrl,
    ctaText,
    ctaSecondaryUrl,
    ctaSecondaryText,
    footerNote,
    accentColor = BRAND.primary,
  } = params;

  const ctaBtn = ctaUrl && ctaText ? `
    <tr><td style="padding: 24px 0 0; text-align: center;">
      <a href="${ctaUrl}" style="display: inline-block; background: ${accentColor}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.3px;">
        ${escapeHtml(ctaText)}
      </a>
    </td></tr>` : '';

  const ctaSecondary = ctaSecondaryUrl && ctaSecondaryText ? `
    <tr><td style="padding: 12px 0 0; text-align: center;">
      <a href="${ctaSecondaryUrl}" style="color: ${accentColor}; text-decoration: none; font-size: 13px; font-weight: 500;">
        ${escapeHtml(ctaSecondaryText)}
      </a>
    </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(headline)}</title>
  <!--[if mso]><style type="text/css">body, table, td {font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;}</style><![endif]-->
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(preheader)}
  </div>

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: ${BRAND.white}; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: ${accentColor}; padding: 28px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Kraftworks
                    </p>
                    <p style="margin: 3px 0 0; font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500;">
                      Career Hub
                    </p>
                  </td>
                  <td align="right" style="padding-left: 16px;">
                    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                      🔧
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${BRAND.dark}; line-height: 1.3; letter-spacing: -0.3px;">
                ${escapeHtml(headline)}
              </h1>
              <div style="color: ${BRAND.muted}; font-size: 14px; line-height: 1.7;">
                ${body}
              </div>

              ${ctaBtn}
              ${ctaSecondary}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid ${BRAND.border}; background: ${BRAND.bg};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 16px;">
                    <p style="margin: 0; font-size: 12px; color: ${BRAND.muted}; line-height: 1.6;">
                      ${footerNote || `You're receiving this email because you have an account with Kraftworks Career Hub. Built for trade professionals.`}
                    </p>
                  </td>
                  <td style="text-align: right;">
                    <a href="${APP_URL}" style="font-size: 12px; color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">
                      kraftworks.app
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 12px;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      &copy; ${new Date().getFullYear()} Kraftworks Career Hub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// Info row helper for tables
function infoRow(label: string, value: string, accent = false): string {
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid ${BRAND.border}; font-size: 14px;">
      <span style="color: ${BRAND.muted};">${escapeHtml(label)}</span>
    </td>
    <td style="padding: 10px 0; border-bottom: 1px solid ${BRAND.border}; font-size: 14px; font-weight: 600; color: ${accent ? BRAND.primary : BRAND.dark}; text-align: right;">
      ${escapeHtml(value)}
    </td>
  </tr>`;
}

// Alert box helper
function alertBox(type: 'success' | 'warning' | 'danger' | 'info', title: string, body: string): string {
  const colors: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
    success: { bg: BRAND.successLight, border: '#bbf7d0', icon: '✅', titleColor: BRAND.success },
    warning: { bg: BRAND.warningLight, border: '#fde68a', icon: '⚠️', titleColor: BRAND.warning },
    danger: { bg: BRAND.dangerLight, border: '#fecaca', icon: '❌', titleColor: BRAND.danger },
    info: { bg: BRAND.primaryLight, border: '#bfdbfe', icon: 'ℹ️', titleColor: BRAND.primary },
  };
  const c = colors[type];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 8px; margin: 20px 0;">
    <tr><td style="padding: 14px 16px;">
      <p style="margin: 0 0 4px; font-weight: 700; font-size: 14px; color: ${c.titleColor};">${c.icon} ${escapeHtml(title)}</p>
      <p style="margin: 0; font-size: 13px; color: ${BRAND.text};">${escapeHtml(body)}</p>
    </td></tr>
  </table>`;
}

// Status badge helper
function statusBadge(label: string, color: string): string {
  return `<span style="display: inline-block; background: ${color}; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px;">${escapeHtml(label)}</span>`;
}

// Section divider
function divider(): string {
  return `<tr><td style="padding: 20px 0;"><div style="border-top: 1px solid ${BRAND.border};"></div></td></tr>`;
}

// ── Send Function ─────────────────────────────────────

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(apiKey: string, options: SendEmailOptions, sandbox = false): Promise<{ id: string } | null> {
  if (sandbox || apiKey === 'sandbox') {
    console.log(`[SANDBOX EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return { id: `sandbox_${Date.now()}` };
  }

  if (!apiKey || apiKey.trim() === '') {
    console.error('RESEND_API_KEY is empty — cannot send email');
    return null;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Resend API error [${response.status}]: ${errorBody}`);
      return null;
    }

    const result = (await response.json()) as { id: string };
    console.log(`Email sent: id=${result.id} to=${options.to}`);
    return result;
  } catch (err) {
    console.error('Email send failed:', err);
    return null;
  }
}

// ── Email Templates ───────────────────────────────────

// 1. Trade Grad Waitlist Confirmation
export function tradeGradConfirmationEmail(fullName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "You're on the Kraftworks Career Fair Waitlist!",
    html: emailTemplate({
      preheader: `Welcome, ${name}! You're on the trade grad waitlist.`,
      headline: `Welcome to Kraftworks, ${name}!`,
      body: `<p style="margin: 0 0 12px;">You've joined the <strong>Kraftworks Digital Career Fair</strong> waitlist as a <strong style="color: ${BRAND.primary};">Trade Graduate</strong>.</p>
<p style="margin: 0 0 12px;">We'll be in touch with updates about the event, new job opportunities, and resources to help you land your next trade role.</p>
<p style="margin: 0;">Trades we cover: Electricians, HVAC Technicians, Welders, Plumbers, Fabricators, and more.</p>`,
      ctaUrl: `${APP_URL}/career-toolkit`,
      ctaText: 'Explore Career Resources',
      ctaSecondaryUrl: `${APP_URL}/career-fair`,
      ctaSecondaryText: 'Browse Open Jobs →',
      footerNote: `Welcome to the Kraftworks community, ${name}. We're here to help you build your trade career.`,
    }),
  };
}

// 2. Employer Waitlist Confirmation
export function employerConfirmationEmail(fullName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "You're on the Kraftworks Employer Waitlist!",
    html: emailTemplate({
      preheader: `Welcome, ${name}! You're on the employer waitlist.`,
      headline: `Welcome to Kraftworks, ${name}!`,
      body: `<p style="margin: 0 0 12px;">You've joined the <strong>Kraftworks Digital Career Fair</strong> waitlist as an <strong style="color: ${BRAND.primary};">Employer</strong>.</p>
<p style="margin: 0 0 12px;">We'll notify you when the event launches with details on how to connect with qualified trade graduates ready to work.</p>
<p style="margin: 0;">We specialize in connecting employers with Electricians, HVAC Techs, Welders, Plumbers, Fabricators, and more.</p>`,
      ctaUrl: `${APP_URL}/contact`,
      ctaText: 'Contact Our Team',
      footerNote: `Welcome aboard, ${name}. We look forward to helping you find great trade talent.`,
    }),
  };
}

// 3. Contact Form Acknowledgment
export function contactAcknowledgmentEmail(fullName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "We received your message – Kraftworks",
    html: emailTemplate({
      preheader: `Thanks for reaching out, ${name}! We'll get back to you soon.`,
      headline: `Thanks, ${name}!`,
      body: `<p style="margin: 0 0 12px;">We've received your message and our team will get back to you as soon as possible — usually within <strong>1–2 business days</strong>.</p>
<p style="margin: 0;">In the meantime, feel free to explore our career resources and job listings.</p>`,
      ctaUrl: `${APP_URL}/career-toolkit`,
      ctaText: 'Explore Career Toolkit',
      footerNote: 'This is an automated acknowledgment. Our team will respond to your inquiry shortly.',
    }),
  };
}

// 4. Feedback Approved
export function feedbackApprovedEmail(fullName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "Your Resume Feedback is Ready — Kraftworks",
    html: emailTemplate({
      preheader: `Great news, ${name}! Your resume feedback has been approved.`,
      headline: 'Your Resume Feedback is Ready!',
      accentColor: BRAND.success,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Great news — your AI-generated <strong>resume feedback</strong> has been reviewed and approved by our team.</p>
<p style="margin: 0 0 12px;">You can now view your full feedback including:</p>
<ul style="margin: 0 0 12px; padding-left: 20px;">
  <li>Your overall score</li>
  <li>What's working well</li>
  <li>Areas to strengthen</li>
  <li>Trade-specific tips</li>
  <li>Actionable next steps</li>
</ul>
<p style="margin: 0;">Use this feedback to strengthen your resume and stand out to employers in the trades.</p>`,
      ctaUrl: `${APP_URL}/resume-review`,
      ctaText: 'View Your Feedback',
      footerNote: 'Your feedback is ready. Review it and update your resume to improve your job applications.',
    }),
  };
}

// 5. Feedback Rejected
export function feedbackRejectedEmail(fullName: string, rejectionReason: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "Resume Feedback Update — Kraftworks",
    html: emailTemplate({
      preheader: `Hi ${name}, your resume feedback couldn't be approved at this time.`,
      headline: 'Resume Feedback Update',
      accentColor: BRAND.danger,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">After review, your AI-generated resume feedback could not be approved at this time.</p>
${alertBox('warning', 'Why?', escapeHtml(rejectionReason))}
<p style="margin: 0;">You can upload a new version of your resume and generate fresh feedback <strong>at no extra credit cost</strong>.</p>`,
      ctaUrl: `${APP_URL}/resume-review`,
      ctaText: 'Upload New Resume',
      footerNote: "Your feedback generation credits are not consumed if the feedback isn't approved.",
    }),
  };
}

// 6. Interview Questions Ready
export function interviewQuestionsReadyEmail(fullName: string, jobDescription: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  const preview = jobDescription.length > 120 ? jobDescription.slice(0, 120) + '…' : jobDescription;
  return {
    subject: "Your Interview Questions Are Ready — Kraftworks",
    html: emailTemplate({
      preheader: `Hi ${name}! Your interview prep questions are ready.`,
      headline: 'Your Interview Prep is Ready!',
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Your AI-generated <strong>interview questions</strong> are ready based on your target job.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.primaryLight}; border-radius: 8px; margin: 16px 0;">
  <tr><td style="padding: 12px 16px; font-size: 13px; color: ${BRAND.dark}; font-style: italic;">
    "${escapeHtml(preview)}"
  </td></tr>
</table>
<p style="margin: 0 0 8px;">Your set includes:</p>
<ul style="margin: 0 0 16px; padding-left: 20px;">
  <li><strong>Technical questions</strong> specific to your trade</li>
  <li><strong>Behavioral questions</strong> for workplace scenarios</li>
  <li><strong>Situational questions</strong> to showcase your skills</li>
</ul>`,
      ctaUrl: `${APP_URL}/interview-prep`,
      ctaText: 'View Your Questions',
      footerNote: 'Practice makes perfect. Review your questions and ace your next interview!',
    }),
  };
}

// 7. Full Feedback Report (the premium branded one)
export function feedbackReportEmail(fullName: string, feedback: any): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  const rawScore = feedback.overall_score ?? 0;
  const score = Math.max(6, rawScore);
  const breakdown = feedback.score_breakdown;
  const scoreColor = score >= 8 ? BRAND.success : score >= 6 ? BRAND.warning : BRAND.danger;

  function renderList(items: string[], tag: string): string {
    if (!Array.isArray(items) || items.length === 0) return '';
    return items.map(item => {
      const html = escapeHtml(item).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<li style="padding: 8px 0; border-bottom: 1px solid ${BRAND.border}; font-size: 13px; line-height: 1.6; color: ${BRAND.text};">${html}</li>`;
    }).join('');
  }

  function scoreBar(label: string, value: number): string {
    const val = Math.max(6, value);
    const pct = Math.round((val / 10) * 100);
    const barColor = val >= 8 ? BRAND.success : val >= 6 ? BRAND.warning : BRAND.danger;
    return `<tr><td style="padding: 6px 0;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
        <span style="color: ${BRAND.muted};">${escapeHtml(label)}</span>
        <span style="font-weight: 700; color: ${BRAND.dark};">${val}/10</span>
      </div>
      <div style="background: ${BRAND.border}; border-radius: 4px; height: 6px; overflow: hidden;">
        <div style="background: ${barColor}; height: 100%; width: ${pct}%; border-radius: 4px;"></div>
      </div>
    </td></tr>`;
  }

  const sections = [
    { title: "What's Working Well", items: feedback.strengths, emoji: '✅' },
    { title: 'Areas to Strengthen', items: feedback.improvements, emoji: '📌' },
    { title: 'Recommendations', items: feedback.suggestions, emoji: '💬' },
    { title: 'Trade-Specific Tips', items: feedback.trade_suggestions, emoji: '🔧' },
    { title: 'Your Next Steps', items: feedback.actionable_steps, emoji: '📋' },
  ];

  const breakdownHtml = breakdown ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 10px; margin: 20px 0; overflow: hidden;">
      <tr><td style="padding: 16px 20px; border-bottom: 1px solid ${BRAND.border}; font-size: 13px; font-weight: 700; color: ${BRAND.dark};">Score Breakdown</td></tr>
      ${scoreBar('Formatting & Layout', breakdown.formatting)}
      ${scoreBar('Content Quality', breakdown.content)}
      ${scoreBar('Trade Relevance', breakdown.trade_relevance)}
      ${scoreBar('Hiring Impact', breakdown.impact)}
    </table>` : '';

  const sectionsHtml = sections.filter(s => s.items?.length > 0).map(s => `
    <tr><td style="padding: 16px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom: 8px; border-bottom: 1px solid ${BRAND.border};">
          <span style="font-size: 13px; font-weight: 700; color: ${BRAND.dark};">${s.emoji} ${escapeHtml(s.title)}</span>
          <span style="font-size: 11px; color: ${BRAND.muted}; margin-left: 6px;">(${s.items.length})</span>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding: 0;">
      <ul style="margin: 0; padding: 0 0 0 20px;">${renderList(s.items, s.title)}</ul>
    </td></tr>`).join('');

  return {
    subject: `Your Resume Feedback Report (Score: ${score}/10) — Kraftworks`,
    html: emailTemplate({
      preheader: `${name}, your personalized resume feedback report is ready. Score: ${score}/10.`,
      headline: 'Your Resume Feedback Report',
      body: `<p style="margin: 0 0 20px; font-size: 14px; color: ${BRAND.muted};">Hi ${name}, here's your personalized resume analysis from Kraftworks.</p>

<!-- Score Circle -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
  <tr><td style="text-align: center; padding: 24px; background: ${scoreColor}0a; border-radius: 12px; border: 2px solid ${scoreColor}30;">
    <div style="font-size: 48px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${score}</div>
    <div style="font-size: 12px; color: ${BRAND.muted}; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">out of 10</div>
    <div style="margin-top: 12px;">
      ${score >= 8 ? statusBadge('Strong Resume', BRAND.success) : score >= 6 ? statusBadge('Room to Improve', BRAND.warning) : statusBadge('Needs Work', BRAND.danger)}
    </div>
  </td></tr>
</table>

${breakdownHtml}
${sectionsHtml}`,
      ctaUrl: `${APP_URL}/resume-review`,
      ctaText: 'View Full Report Online',
      ctaSecondaryUrl: `${APP_URL}/career-fair`,
      ctaSecondaryText: 'Browse Jobs →',
      footerNote: 'This report is generated by Kraftworks AI. Use it to strengthen your resume and land your next trade job.',
    }),
  };
}

// 8. Application Submitted (to applicant)
export function applicationSubmittedEmail(fullName: string, jobTitle: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: `Application Submitted – ${jobTitle} at ${companyName}`,
    html: emailTemplate({
      preheader: `Your application for ${jobTitle} has been submitted.`,
      headline: 'Application Submitted!',
      accentColor: BRAND.success,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong> has been submitted successfully.</p>
<p style="margin: 0 0 12px;">The employer will review your application. You'll receive an email notification when the status changes.</p>
${alertBox('info', 'What happens next?', 'Keep your resume updated and stay ready for interviews. You can track all your applications anytime.')}`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'View My Applications',
      ctaSecondaryUrl: `${APP_URL}/career-fair`,
      ctaSecondaryText: 'Browse More Jobs →',
      footerNote: "Bookmark hiring.kraftworks.app to manage your applications anytime.",
    }),
  };
}

// 9. Application Status Update (to applicant)
export function applicationStatusUpdateEmail(
  fullName: string, jobTitle: string, companyName: string, newStatus: string, employerNotes?: string,
): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  const statusConfig: Record<string, { label: string; color: string; emoji: string; desc: string }> = {
    reviewed: { label: 'Reviewed', color: BRAND.primary, emoji: '👀', desc: 'The employer has reviewed your application.' },
    shortlisted: { label: 'Shortlisted', color: BRAND.purple, emoji: '⭐', desc: "You're being considered for this position!" },
    interview: { label: 'Interview Stage', color: BRAND.teal, emoji: '📅', desc: 'An interview has been scheduled or is being planned.' },
    offered: { label: 'Offer Extended', color: BRAND.success, emoji: '🎉', desc: 'Congratulations! An offer has been extended to you.' },
    hired: { label: 'Hired!', color: BRAND.success, emoji: '🎊', desc: "You've been hired! Welcome to the team." },
    rejected: { label: 'Not Selected', color: BRAND.danger, emoji: '💪', desc: "The employer moved forward with other candidates. Keep applying!" },
  };
  const cfg = statusConfig[newStatus] || { label: newStatus, color: BRAND.muted, emoji: '📋', desc: 'Your application status has been updated.' };
  const notesHtml = employerNotes ? `<p style="margin: 0 0 12px;"><strong>Note from employer:</strong><br>${escapeHtml(employerNotes)}</p>` : '';

  return {
    subject: `Application Update: ${cfg.label} – ${jobTitle}`,
    html: emailTemplate({
      preheader: `Your application for ${jobTitle} has been updated: ${cfg.label}.`,
      headline: `Application Status: ${cfg.label}`,
      accentColor: cfg.color,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 16px;">Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong> has been updated.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${cfg.color}0a; border-radius: 12px; margin: 0 0 20px; overflow: hidden;">
  <tr><td style="padding: 20px; text-align: center;">
    <div style="font-size: 32px; margin-bottom: 8px;">${cfg.emoji}</div>
    <div style="font-size: 18px; font-weight: 800; color: ${cfg.color};">${escapeHtml(cfg.label)}</div>
    <div style="font-size: 13px; color: ${BRAND.muted}; margin-top: 6px;">${cfg.desc}</div>
  </td></tr>
</table>
${notesHtml}
<p style="margin: 0;">${newStatus === 'rejected' ? "Don't give up — keep applying to other positions. Your next opportunity is out there!" : 'Stay tuned for further updates from the employer.'}</p>`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'View Application Details',
      ctaSecondaryUrl: `${APP_URL}/career-fair`,
      ctaSecondaryText: newStatus === 'rejected' ? 'Browse More Jobs →' : undefined,
      footerNote: newStatus === 'hired' ? '🎉 Congratulations on your new job! We wish you all the best in your new role.' : undefined,
    }),
  };
}

// 10. Application Withdrawn (to applicant)
export function applicationWithdrawnEmail(fullName: string, jobTitle: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: `Application Withdrawn – ${jobTitle}`,
    html: emailTemplate({
      preheader: `Your application for ${jobTitle} has been withdrawn.`,
      headline: 'Application Withdrawn',
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong> has been successfully withdrawn.</p>
<p style="margin: 0;">You can browse and apply to other open positions anytime.</p>`,
      ctaUrl: `${APP_URL}/career-fair`,
      ctaText: 'Browse Open Jobs',
      footerNote: "Your application has been withdrawn. You can still apply to other positions.",
    }),
  };
}

// 11. Company Registered (to employer)
export function companyRegistrationEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: `Company Registered – ${companyName}`,
    html: emailTemplate({
      preheader: `${companyName} has been registered on Kraftworks.`,
      headline: 'Company Registered Successfully!',
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Your company <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong> has been registered on <strong>Kraftworks Career Hub</strong>.</p>
<p style="margin: 0 0 12px;">Our team will review your profile and notify you once it's approved. In the meantime, you can start preparing your job listings.</p>
${alertBox('info', 'What\'s next?', 'Once approved, you\'ll be able to post jobs and start receiving applications from qualified trade professionals.')}`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'Go to Employer Portal',
      footerNote: 'Your company is pending review. You\'ll receive an email once approved.',
    }),
  };
}

// 12. Company Approved (to employer)
export function companyApprovedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: `Company Approved – ${companyName}`,
    html: emailTemplate({
      preheader: `Your company ${companyName} has been approved on Kraftworks!`,
      headline: 'Your Company Has Been Approved!',
      accentColor: BRAND.success,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 16px;">Great news — <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong> has been <span style="color: ${BRAND.success}; font-weight: 700;">approved</span> and is now active on <strong>Kraftworks Career Hub</strong>!</p>
<p style="margin: 0 0 12px;">You can now:</p>
<ul style="margin: 0 0 16px; padding-left: 20px;">
  <li style="margin-bottom: 6px;"><strong>Post job listings</strong> for trade professionals</li>
  <li style="margin-bottom: 6px;"><strong>Receive applications</strong> from qualified candidates</li>
  <li style="margin-bottom: 6px;"><strong>Manage applicants</strong> and track your pipeline</li>
</ul>`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'Post Your First Job',
      ctaSecondaryUrl: `${HIRING_URL}/dashboard`,
      ctaSecondaryText: 'Go to Employer Dashboard →',
      footerNote: `${companyName} is now live on Kraftworks Career Hub. Start connecting with trade talent today!`,
    }),
  };
}

// 13. Company Suspended (to employer)
export function companySuspendedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: `Company Status Update – ${companyName}`,
    html: emailTemplate({
      preheader: `Your company ${companyName} has been suspended.`,
      headline: 'Company Status Update',
      accentColor: BRAND.danger,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Your company <strong>${escapeHtml(companyName)}</strong> has been temporarily <strong style="color: ${BRAND.danger};">suspended</strong> by the Kraftworks team.</p>
${alertBox('warning', 'What does this mean?', 'While suspended, your job listings are not visible and new applications cannot be received.')}<p style="margin: 0 0 12px;">If you believe this is an error, please contact our support team and we'll review your case.</p>`,
      ctaUrl: `${APP_URL}/contact`,
      ctaText: 'Contact Support',
      footerNote: 'This action was taken by the Kraftworks admin team. Contact support for more information.',
    }),
  };
}

// 14. New Application Received (to employer)
export function newApplicationReceivedEmail(employerName: string, applicantName: string, jobTitle: string): { subject: string; html: string } {
  const name = escapeHtml(employerName?.trim() || 'there');
  return {
    subject: `New Application – ${jobTitle}`,
    html: emailTemplate({
      preheader: `${applicantName} just applied to ${jobTitle}.`,
      headline: 'New Application Received!',
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;"><strong style="color: ${BRAND.primary};">${escapeHtml(applicantName)}</strong> just applied to your <strong>${escapeHtml(jobTitle)}</strong> position.</p>
<p style="margin: 0 0 12px;">Review their application and resume to decide on next steps — shortlist, schedule an interview, or move forward.</p>`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'Review Applications',
      ctaSecondaryUrl: `${HIRING_URL}/dashboard`,
      ctaSecondaryText: 'View All Jobs →',
      footerNote: 'A new application is waiting for your review. The sooner you respond, the better candidate experience.',
    }),
  };
}

// 15. Application Withdrawn (to employer)
export function applicationWithdrawnEmployerEmail(employerName: string, applicantName: string, jobTitle: string): { subject: string; html: string } {
  const name = escapeHtml(employerName?.trim() || 'there');
  return {
    subject: `Application Withdrawn – ${jobTitle}`,
    html: emailTemplate({
      preheader: `${applicantName} has withdrawn their application for ${jobTitle}.`,
      headline: 'Application Withdrawn',
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;"><strong>${escapeHtml(applicantName)}</strong> has withdrawn their application for the <strong>${escapeHtml(jobTitle)}</strong> position.</p>
<p style="margin: 0;">You can continue reviewing other applications for this and other job listings.</p>`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'View Your Listings',
      footerNote: 'The applicant has decided to withdraw their application. Other candidates may still be available.',
    }),
  };
}

// 16. Job Posted (to employer)
export function jobPostedEmail(employerName: string, jobTitle: string, status: string): { subject: string; html: string } {
  const name = escapeHtml(employerName?.trim() || 'there');
  const isDraft = status === 'draft';
  return {
    subject: isDraft ? `Job Draft Saved – ${jobTitle}` : `Job Posted – ${jobTitle}`,
    html: emailTemplate({
      preheader: isDraft ? `Your job draft "${jobTitle}" has been saved.` : `Your job "${jobTitle}" is now live!`,
      headline: isDraft ? 'Job Draft Saved' : 'Job Posted Successfully!',
      accentColor: isDraft ? BRAND.muted : BRAND.success,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Your job listing <strong style="color: ${BRAND.primary};">${escapeHtml(jobTitle)}</strong> has been ${isDraft ? "saved as a <strong>draft</strong>" : "<span style=\"color: " + BRAND.success + "; font-weight: 700;\">published and is now live</span>"}.</p>
<p style="margin: 0;">${isDraft ? "You can publish it anytime from your dashboard when you're ready to start receiving applications." : "Qualified trade professionals can now find and apply. You'll receive email notifications as applications come in."}</p>`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: isDraft ? 'Publish from Dashboard' : 'Manage Your Jobs',
      ctaSecondaryUrl: `${HIRING_URL}/dashboard`,
      ctaSecondaryText: 'View Dashboard →',
      footerNote: isDraft ? 'Your draft is safe. Publish it when you\'re ready to start receiving applications.' : 'Your job is live on Kraftworks Career Hub. Good luck finding great trade talent!',
    }),
  };
}

// 17. Credits Updated (to user)
export function creditsUpdatedEmail(fullName: string, oldAvailable: number, newAvailable: number): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  const added = newAvailable - oldAvailable;
  const isIncrease = newAvailable > oldAvailable;
  return {
    subject: `Your AI Credits Have Been Updated`,
    html: emailTemplate({
      preheader: `Your AI credits have been updated. You now have ${newAvailable} credits.`,
      headline: isIncrease ? 'AI Credits Added!' : 'AI Credits Updated',
      accentColor: isIncrease ? BRAND.success : BRAND.warning,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 16px;">${isIncrease ? 'Great news!' : ''} Your AI credits have been updated by an admin.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 10px; margin: 0 0 16px; overflow: hidden;">
  <tr><td style="padding: 16px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Previous', `${oldAvailable} credits`)}
      ${infoRow('New', `${newAvailable} credits`)}
      ${isIncrease && added > 0 ? infoRow('Added', `+${added} credits`, true) : ''}
    </table>
  </td></tr>
</table>
<p style="margin: 0 0 8px;">You now have <strong>${newAvailable} available AI actions</strong> for:</p>
<ul style="margin: 0 0 16px; padding-left: 20px;">
  <li>Resume reviews & feedback</li>
  <li>Interview question generation</li>
</ul>`,
      ctaUrl: `${APP_URL}/dashboard`,
      ctaText: 'Go to Dashboard',
      footerNote: isIncrease ? `+${added} AI credits added to your account. Use them to strengthen your job applications.` : 'Your AI credits have been adjusted. Contact support if you have questions.',
    }),
  };
}

// 18. Admin: New Company Registered
export function adminNewCompanyEmail(companyName: string, companyEmail: string, ownerName: string, city: string, state: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] New Company: ${companyName}`,
    html: emailTemplate({
      preheader: `A new company "${companyName}" has registered and needs review.`,
      headline: 'New Company Registration',
      accentColor: BRAND.purple,
      body: `<p style="margin: 0 0 12px;">A new company has registered and requires admin review.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 10px; margin: 0 0 16px; overflow: hidden;">
  <tr><td style="padding: 16px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Company', companyName, true)}
      ${infoRow('Owner', ownerName || 'N/A')}
      ${infoRow('Email', companyEmail)}
      ${infoRow('Location', `${city}, ${state}`)}
    </table>
  </td></tr>
</table>
<p style="margin: 0;">Review the company details and approve or suspend their account.</p>`,
      ctaUrl: `${APP_URL}/admin`,
      ctaText: 'Review in Admin Panel',
      footerNote: 'This is an admin notification from Kraftworks Career Hub.',
    }),
  };
}

// 19. Employer Access Request Submitted (to requester)
export function employerAccessRequestSubmittedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "Employer Access Request Received",
    html: emailTemplate({
      preheader: `Thank you, ${name}! We've received your employer access request for ${companyName}.`,
      headline: "We've Received Your Request",
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">Thank you for your interest in posting jobs on Kraftworks as <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong>.</p>
<p style="margin: 0 0 12px;">Our team will review your company details and get back to you via email. This usually takes <strong>1–2 business days</strong>.</p>
${alertBox('info', 'What to expect', 'Once approved, you\'ll receive an email with access to the Employer Portal where you can post jobs and manage applications.')}`,
      ctaUrl: `${APP_URL}/dashboard`,
      ctaText: 'Back to Dashboard',
      footerNote: `Your employer access request for ${companyName} is pending review. You'll be notified by email once a decision is made.`,
    }),
  };
}

// 20. Admin: Employer Access Request
export function adminEmployerAccessRequestEmail(companyName: string, companyEmail: string, requesterName: string, city: string, state: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] Employer Access Request: ${companyName}`,
    html: emailTemplate({
      preheader: `${companyName} has requested employer access. Review needed.`,
      headline: 'New Employer Access Request',
      accentColor: BRAND.warning,
      body: `<p style="margin: 0 0 12px;">An existing user has requested <strong>employer access</strong>. Please review their details:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 10px; margin: 0 0 16px; overflow: hidden;">
  <tr><td style="padding: 16px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Company', companyName, true)}
      ${infoRow('Requester', requesterName || 'N/A')}
      ${infoRow('Email', companyEmail)}
      ${infoRow('Location', `${city}, ${state}`)}
    </table>
  </td></tr>
</table>
<p style="margin: 0;">Review in the Admin Panel and approve or reject the request.</p>`,
      ctaUrl: `${APP_URL}/admin`,
      ctaText: 'Review in Admin Panel',
      footerNote: 'This is an admin notification. Take action on the employer access request.',
    }),
  };
}

// 21. Employer Access Approved (to requester)
export function employerAccessApprovedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "Your Employer Access Has Been Approved!",
    html: emailTemplate({
      preheader: `Congratulations, ${name}! Your employer access for ${companyName} has been approved.`,
      headline: 'Welcome to the Employer Portal!',
      accentColor: BRAND.success,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 16px;">Great news! Your request to register <strong style="color: ${BRAND.primary};">${escapeHtml(companyName)}</strong> as an employer on <strong>Kraftworks Career Hub</strong> has been <span style="color: ${BRAND.success}; font-weight: 700;">approved</span>!</p>
${alertBox('success', 'Next Step: Access Your Employer Dashboard', 'Click the button below or go to hiring.kraftworks.app and refresh the page. Your employer dashboard will now be visible. Bookmark hiring.kraftworks.app for easy access!')}
<p style="margin: 16px 0 12px;">Once in the Employer Portal, you can:</p>
<ul style="margin: 0 0 16px; padding-left: 20px;">
  <li style="margin-bottom: 6px;"><strong>Post job listings</strong> for trade professionals</li>
  <li style="margin-bottom: 6px;"><strong>Receive applications</strong> from qualified candidates</li>
  <li style="margin-bottom: 6px;"><strong>Track your pipeline</strong> from application to hire</li>
</ul>
<p style="margin: 0; font-size: 13px; color: ${BRAND.muted};">Note: The Employer Portal is separate from the Career Hub — use <strong>hiring.kraftworks.app</strong> specifically for your employer tasks.</p>`,
      ctaUrl: `${HIRING_URL}/dashboard`,
      ctaText: 'Open Employer Dashboard →',
      footerNote: `Congratulations on your approval, ${name}! If the dashboard doesn't load, please refresh the page. Need help? Contact support@kraftworks.app.`,
    }),
  };
}

// 22. Employer Access Rejected (to requester)
export function employerAccessRejectedEmail(fullName: string, companyName: string, reason?: string): { subject: string; html: string } {
  const name = escapeHtml(fullName?.trim() || 'there');
  return {
    subject: "Update on Your Employer Access Request",
    html: emailTemplate({
      preheader: `Your employer access request for ${companyName} could not be approved.`,
      headline: 'Employer Access Request Update',
      accentColor: BRAND.danger,
      body: `<p style="margin: 0 0 12px;">Hi ${name},</p>
<p style="margin: 0 0 12px;">After reviewing your request to register <strong>${escapeHtml(companyName)}</strong> as an employer, we're unable to approve access at this time.</p>
${reason ? alertBox('warning', 'Reason', escapeHtml(reason)) : ''}
<p style="margin: 0 0 12px;">If you believe this was a mistake or have additional information to share, please contact our support team.</p>`,
      ctaUrl: `${APP_URL}/contact`,
      ctaText: 'Contact Support',
      footerNote: "Your employer access request has been declined. Contact support for more information or to resubmit.",
    }),
  };
}

// Admin: Resume Feedback Notification
export function adminResumeNotificationEmail(userName: string, resumeFileName: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] New Resume Feedback – ${userName}`,
    html: emailTemplate({
      preheader: `A new resume feedback from ${userName} needs review.`,
      headline: 'New Resume Feedback Awaiting Review',
      accentColor: BRAND.purple,
      body: `<p style="margin: 0 0 12px;">A new AI-generated resume feedback has been submitted and requires admin review.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 10px; margin: 0 0 16px; overflow: hidden;">
  <tr><td style="padding: 16px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('User', userName, true)}
      ${infoRow('Resume', resumeFileName)}
    </table>
  </td></tr>
</table>`,
      ctaUrl: `${APP_URL}/admin`,
      ctaText: 'Review in Admin Panel',
      footerNote: 'This is an admin notification. New resume feedback is pending review.',
    }),
  };
}

// Admin: Contact Form Notification
export function contactAdminNotificationEmail(fullName: string, email: string, subject: string | null, message: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] New Contact: ${subject || 'No subject'}`,
    html: emailTemplate({
      preheader: `${fullName} sent a message via the contact form.`,
      headline: 'New Contact Form Submission',
      accentColor: BRAND.teal,
      body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 10px; margin: 0 0 16px; overflow: hidden;">
  <tr><td style="padding: 16px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Name', fullName, true)}
      ${infoRow('Email', email)}
      ${infoRow('Subject', subject || 'N/A')}
    </table>
  </td></tr>
</table>
<p style="margin: 0 0 8px; font-size: 13px; color: ${BRAND.muted};">Message:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg}; border-radius: 8px;">
  <tr><td style="padding: 14px 16px; font-size: 13px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(message)}</td></tr>
</table>`,
      ctaUrl: `${APP_URL}/admin`,
      ctaText: 'View in Admin Panel',
      footerNote: 'A new contact form submission is waiting for your response.',
    }),
  };
}
