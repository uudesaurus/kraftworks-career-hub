const RESEND_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Kraftworks <career@kraftworks.app>';
const APP_URL = 'https://career.kraftworks.app';

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
      console.error(`From: ${FROM_EMAIL} | To: ${options.to} | Subject: ${options.subject}`);
      return null;
    }

    const result = (await response.json()) as { id: string };
    console.log(`Email sent successfully: id=${result.id} to=${options.to}`);
    return result;
  } catch (err) {
    console.error('Email send failed (network/exception):', err);
    return null;
  }
}

// ── Shared helpers ──────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ctaButton(text: string, url: string): string {
  return `<p><a href="${url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">${escapeHtml(text)}</a></p>`;
}

function emailLayout(content: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
${content}
<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
<p style="color: #999; font-size: 12px;">Kraftworks Career Hub — Built for trade professionals. <a href="${APP_URL}" style="color: #2563eb;">Visit Kraftworks</a></p>
</div>`;
}

// ── Existing templates (refactored) ─────────────────────

// Admin notification: new resume feedback generated
export function adminResumeNotificationEmail(userName: string, resumeFileName: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] New Resume Feedback – ${userName}`,
    html: emailLayout(`
      <h2>New Resume Feedback Awaiting Review</h2>
      <p>A new AI-generated resume feedback has been submitted and requires admin review.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">User</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHtml(userName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Resume</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHtml(resumeFileName)}</td></tr>
      </table>
      ${ctaButton('Review in Admin Panel', `${APP_URL}/admin`)}
    `),
  };
}

// Trade grad waitlist confirmation
export function tradeGradConfirmationEmail(fullName: string): { subject: string; html: string } {
  return {
    subject: "You're on the Kraftworks Career Fair Waitlist!",
    html: emailLayout(`
      <h2>Welcome, ${escapeHtml(fullName)}!</h2>
      <p>You've been added to the Kraftworks Digital Career Fair waitlist as a <strong>Trade Graduate</strong>.</p>
      <p>We'll be in touch with updates about the event, career opportunities, and resources to help you succeed in your trade career.</p>
      ${ctaButton('Explore Career Toolkit', `${APP_URL}/career-toolkit`)}
    `),
  };
}

// Employer waitlist confirmation
export function employerConfirmationEmail(fullName: string): { subject: string; html: string } {
  return {
    subject: "You're on the Kraftworks Employer Waitlist!",
    html: emailLayout(`
      <h2>Welcome, ${escapeHtml(fullName)}!</h2>
      <p>You've been added to the Kraftworks Digital Career Fair waitlist as an <strong>Employer</strong>.</p>
      <p>We'll notify you when the event is ready and provide details on how to connect with qualified trade graduates.</p>
    `),
  };
}

// Contact form acknowledgment
export function contactAcknowledgmentEmail(fullName: string): { subject: string; html: string } {
  return {
    subject: "We received your message – Kraftworks",
    html: emailLayout(`
      <h2>Thanks for reaching out, ${escapeHtml(fullName)}!</h2>
      <p>We've received your message and will get back to you as soon as possible.</p>
      ${ctaButton('Explore Career Toolkit', `${APP_URL}/career-toolkit`)}
    `),
  };
}

// Contact form admin notification
export function contactAdminNotificationEmail(fullName: string, email: string, subject: string | null, message: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] New Contact: ${subject || 'No subject'}`,
    html: emailLayout(`
      <h2>New Contact Form Submission</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Subject</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(subject || 'N/A')}</td></tr>
      </table>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</div>
      ${ctaButton('View in Admin Panel', `${APP_URL}/admin`)}
    `),
  };
}

// Feedback approved notification to user
export function feedbackApprovedEmail(fullName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: 'Your Resume Feedback is Ready — Kraftworks',
    html: emailLayout(`
      <h2>Your Resume Feedback is Ready!</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Great news — your AI-generated resume feedback has been reviewed and approved by our team. You can now view your full feedback including your score, strengths, areas for improvement, and actionable suggestions.</p>
      ${ctaButton('View Your Feedback', `${APP_URL}/resume-review`)}
      <p style="color: #666; font-size: 14px;">Use this feedback to strengthen your resume and stand out to employers in the trades.</p>
    `),
  };
}

// ── New templates ───────────────────────────────────────

// Feedback rejected notification to user
export function feedbackRejectedEmail(fullName: string, rejectionReason: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: 'Resume Feedback Update — Kraftworks',
    html: emailLayout(`
      <h2>Resume Feedback Update</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>After review, your AI-generated resume feedback could not be approved at this time.</p>
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong>Reason:</strong> ${escapeHtml(rejectionReason)}
      </div>
      <p>You can upload a new version of your resume and generate fresh feedback at no extra credit cost.</p>
      ${ctaButton('Upload New Resume', `${APP_URL}/resume-review`)}
    `),
  };
}

// AI interview questions ready
export function interviewQuestionsReadyEmail(fullName: string, jobDescription: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  const preview = jobDescription.length > 80 ? jobDescription.slice(0, 80) + '…' : jobDescription;
  return {
    subject: 'Your Interview Questions Are Ready — Kraftworks',
    html: emailLayout(`
      <h2>Your Interview Prep is Ready!</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Your AI-generated interview questions have been prepared based on the following job description:</p>
      <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-style: italic; color: #555;">
        "${escapeHtml(preview)}"
      </div>
      <p>Your set includes <strong>technical</strong>, <strong>behavioral</strong>, and <strong>situational</strong> questions — plus recommended study resources.</p>
      ${ctaButton('View Your Questions', `${APP_URL}/interview-prep`)}
    `),
  };
}

// Full feedback report email with Kraftworks branding (user can email it to themselves)
export function feedbackReportEmail(fullName: string, feedback: any): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  const rawScore = feedback.overall_score ?? 0;
  const score = Math.max(6, rawScore);
  const breakdown = feedback.score_breakdown;
  const brandColor = '#2563eb';

  function renderList(items: string[]): string {
    if (!Array.isArray(items) || items.length === 0) return '';
    return items.map(item => {
      const html = escapeHtml(item).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.7; color: #444; font-size: 13px;">${html}</li>`;
    }).join('');
  }

  function scoreBar(label: string, value: number): string {
    const val = Math.max(6, value);
    const pct = Math.round((val / 10) * 100);
    return `<div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
        <span style="color: #6b7280;">${escapeHtml(label)}</span>
        <span style="font-weight: 600; color: #111;">${val}/10</span>
      </div>
      <div style="background: #e5e7eb; border-radius: 4px; height: 6px; overflow: hidden;">
        <div style="background: ${brandColor}; height: 100%; width: ${pct}%; border-radius: 4px;"></div>
      </div>
    </div>`;
  }

  const breakdownHtml = breakdown ? `
    <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #333; font-weight: 600;">Score Breakdown</h3>
      ${scoreBar('Formatting & Layout', breakdown.formatting)}
      ${scoreBar('Content Quality', breakdown.content)}
      ${scoreBar('Trade Relevance', breakdown.trade_relevance)}
      ${scoreBar('Hiring Impact', breakdown.impact)}
    </div>` : '';

  const motivationHtml = feedback.motivation_note ? `
    <div style="background: #f9fafb; border-left: 3px solid ${brandColor}; padding: 14px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 13px;">${escapeHtml(feedback.motivation_note)}</p>
    </div>` : '';

  function section(title: string, items: string[], emoji: string): string {
    if (!Array.isArray(items) || items.length === 0) return '';
    return `
      <div style="margin: 24px 0;">
        <h3 style="color: #111; font-size: 14px; margin: 0 0 8px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
          ${emoji} ${escapeHtml(title)} <span style="color: #9ca3af; font-weight: normal; font-size: 11px;">(${items.length})</span>
        </h3>
        <ul style="margin: 0; padding: 0; list-style: none;">${renderList(items)}</ul>
      </div>`;
  }

  return {
    subject: `Your Resume Feedback Report (Score: ${score}/10) — Kraftworks`,
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 18px; font-weight: 700; color: ${brandColor}; letter-spacing: -0.5px;">Kraftworks</div>
        <div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Career Hub</div>
      </div>

      <h2 style="margin-bottom: 4px; font-size: 18px;">Resume Feedback Report</h2>
      <p style="color: #6b7280; margin-top: 0; font-size: 13px;">Hi ${escapeHtml(displayName)}, here's your personalized resume analysis.</p>

      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; width: 72px; height: 72px; border-radius: 50%; border: 3px solid ${brandColor}; line-height: 72px; font-size: 24px; font-weight: 700; color: ${brandColor};">
          ${score}
        </div>
        <p style="margin: 6px 0 0; color: #6b7280; font-size: 11px;">Overall Score (out of 10)</p>
      </div>

      ${breakdownHtml}
      ${motivationHtml}

      ${section("What's Working Well", feedback.strengths, '✅')}
      ${section('Areas to Strengthen', feedback.improvements, '📌')}
      ${section('Recommendations', feedback.suggestions, '💬')}
      ${section('Trade-Specific Tips', feedback.trade_suggestions, '🔧')}
      ${section('Your Next Steps', feedback.actionable_steps, '📋')}

      <div style="text-align: center; margin: 32px 0 16px;">
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 16px;">Ready to update your resume? Head back to your dashboard:</p>
      </div>
      ${ctaButton('Back to Resume Review', `${APP_URL}/resume-review`)}

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 10px; line-height: 1.5; margin: 0;">
          &copy; ${new Date().getFullYear()} Kraftworks Career Hub&trade; &mdash; All rights reserved.<br/>
          Built for trade professionals.
        </p>
      </div>
    `),
  };
}

// Job application submitted (to applicant)
export function applicationSubmittedEmail(fullName: string, jobTitle: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: `Application Submitted – ${jobTitle} at ${companyName}`,
    html: emailLayout(`
      <h2>Application Submitted!</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been successfully submitted.</p>
      <p>The employer will review your application and you'll be notified when the status changes.</p>
      ${ctaButton('View My Applications', `${APP_URL}/settings`)}
    `),
  };
}

// Application status update (to applicant)
export function applicationStatusUpdateEmail(
  fullName: string, jobTitle: string, companyName: string, newStatus: string, employerNotes?: string,
): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  const statusLabels: Record<string, string> = {
    reviewed: 'Reviewed',
    shortlisted: 'Shortlisted',
    interview: 'Interview Scheduled',
    offered: 'Offer Extended',
    hired: 'Hired',
    rejected: 'Not Selected',
  };
  const statusColors: Record<string, string> = {
    reviewed: '#2563eb',
    shortlisted: '#7c3aed',
    interview: '#0891b2',
    offered: '#059669',
    hired: '#16a34a',
    rejected: '#dc2626',
  };
  const label = statusLabels[newStatus] || newStatus;
  const color = statusColors[newStatus] || '#2563eb';

  return {
    subject: `Application Update: ${label} – ${jobTitle}`,
    html: emailLayout(`
      <h2>Application Status Update</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been updated:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; padding: 8px 20px; background: ${color}; color: #fff; border-radius: 20px; font-weight: 600; font-size: 16px;">${escapeHtml(label)}</span>
      </div>
      ${employerNotes ? `<div style="background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin: 16px 0;"><strong>Note from employer:</strong><br>${escapeHtml(employerNotes)}</div>` : ''}
      ${ctaButton('View Application Details', `${APP_URL}/settings`)}
    `),
  };
}

// Application withdrawn (to applicant)
export function applicationWithdrawnEmail(fullName: string, jobTitle: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: `Application Withdrawn – ${jobTitle}`,
    html: emailLayout(`
      <h2>Application Withdrawn</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been successfully withdrawn.</p>
      <p>You can browse and apply to other open positions anytime.</p>
      ${ctaButton('Browse Jobs', `${APP_URL}/career-fair`)}
    `),
  };
}

// Company registration confirmation (to employer)
export function companyRegistrationEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: `Company Registered – ${companyName}`,
    html: emailLayout(`
      <h2>Company Registered Successfully!</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Your company <strong>${escapeHtml(companyName)}</strong> has been registered on Kraftworks. Our team will review your profile, and you'll be notified once it's approved.</p>
      <p>In the meantime, you can start creating job listings to prepare for when your company goes live.</p>
      ${ctaButton('Go to Employer Dashboard', `${APP_URL}/dashboard`)}
    `),
  };
}

// Company approved (to employer)
export function companyApprovedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: `Company Approved – ${companyName}`,
    html: emailLayout(`
      <h2>Your Company Has Been Approved!</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Great news — <strong>${escapeHtml(companyName)}</strong> has been approved and is now active on Kraftworks!</p>
      <p>You can now post job listings and start connecting with qualified trade graduates.</p>
      ${ctaButton('Post a Job', `${APP_URL}/dashboard`)}
    `),
  };
}

// Company suspended (to employer)
export function companySuspendedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: `Company Status Update – ${companyName}`,
    html: emailLayout(`
      <h2>Company Status Update</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Your company <strong>${escapeHtml(companyName)}</strong> has been temporarily suspended by the Kraftworks team.</p>
      <p>While suspended, your job listings will not be visible and new applications cannot be received. If you believe this is an error, please contact our support team.</p>
      ${ctaButton('Contact Support', `${APP_URL}/contact`)}
    `),
  };
}

// New application received (to employer)
export function newApplicationReceivedEmail(employerName: string, applicantName: string, jobTitle: string): { subject: string; html: string } {
  const displayName = employerName?.trim() || 'there';
  return {
    subject: `New Application – ${jobTitle}`,
    html: emailLayout(`
      <h2>New Application Received!</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p><strong>${escapeHtml(applicantName)}</strong> has applied to your <strong>${escapeHtml(jobTitle)}</strong> position.</p>
      <p>Review their application and resume to decide on next steps.</p>
      ${ctaButton('Review Applications', `${APP_URL}/dashboard`)}
    `),
  };
}

// Application withdrawn notification (to employer)
export function applicationWithdrawnEmployerEmail(employerName: string, applicantName: string, jobTitle: string): { subject: string; html: string } {
  const displayName = employerName?.trim() || 'there';
  return {
    subject: `Application Withdrawn – ${jobTitle}`,
    html: emailLayout(`
      <h2>Application Withdrawn</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p><strong>${escapeHtml(applicantName)}</strong> has withdrawn their application for the <strong>${escapeHtml(jobTitle)}</strong> position.</p>
      ${ctaButton('View Your Listings', `${APP_URL}/dashboard`)}
    `),
  };
}

// Job posted confirmation (to employer)
export function jobPostedEmail(employerName: string, jobTitle: string, status: string): { subject: string; html: string } {
  const displayName = employerName?.trim() || 'there';
  const isDraft = status === 'draft';
  return {
    subject: isDraft ? `Job Draft Saved – ${jobTitle}` : `Job Posted – ${jobTitle}`,
    html: emailLayout(`
      <h2>${isDraft ? 'Job Draft Saved' : 'Job Posted Successfully!'}</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      ${isDraft
        ? `<p>Your job listing <strong>${escapeHtml(jobTitle)}</strong> has been saved as a draft. You can publish it anytime from your dashboard.</p>`
        : `<p>Your job listing <strong>${escapeHtml(jobTitle)}</strong> is now live and visible to trade graduates on Kraftworks!</p>`}
      ${ctaButton('View Your Jobs', `${APP_URL}/dashboard`)}
    `),
  };
}

// Notify user: AI credits updated
export function creditsUpdatedEmail(fullName: string, oldAvailable: number, newAvailable: number): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  const added = newAvailable - oldAvailable;
  const isIncrease = newAvailable > oldAvailable;
  const introText = isIncrease
    ? 'Great news! An admin has updated your AI credits.'
    : 'An admin has updated your AI credits.';
  return {
    subject: `Your AI Credits Have Been Updated`,
    html: emailLayout(`
      <h2>AI Credits Updated</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>${introText}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Previous Available</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${oldAvailable}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">New Available</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${newAvailable}</td></tr>
        ${added > 0 ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Credits Added</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; color: #16a34a;">+${added}</td></tr>` : ''}
      </table>
      <p>You now have <strong>${newAvailable}</strong> available AI actions (resume reviews & interview questions).</p>
      ${ctaButton('Go to Dashboard', `${APP_URL}/dashboard`)}
    `),
  };
}

// Admin alert: new company registered
export function adminNewCompanyEmail(companyName: string, companyEmail: string, ownerName: string, city: string, state: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] New Company: ${companyName}`,
    html: emailLayout(`
      <h2>New Company Registration</h2>
      <p>A new company has been registered and requires review.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHtml(companyName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Owner</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(ownerName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(companyEmail)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(city)}, ${escapeHtml(state)}</td></tr>
      </table>
      ${ctaButton('Review in Admin Panel', `${APP_URL}/admin`)}
    `),
  };
}

// Employee → Employer access request submitted (to requester)
export function employerAccessRequestSubmittedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: 'Employer Access Request Received',
    html: emailLayout(`
      <h2>We've Received Your Request</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Thank you for your interest in posting jobs on Kraftworks as <strong>${escapeHtml(companyName)}</strong>.</p>
      <p>Our team will review your company details and get back to you via email. This usually takes 1–2 business days.</p>
      <p>In the meantime, you can continue using all your existing features on Kraftworks.</p>
      ${ctaButton('Back to Dashboard', `${APP_URL}/dashboard`)}
    `),
  };
}

// Admin alert: new employer access request
export function adminEmployerAccessRequestEmail(companyName: string, companyEmail: string, requesterName: string, city: string, state: string): { subject: string; html: string } {
  return {
    subject: `[Kraftworks] Employer Access Request: ${companyName}`,
    html: emailLayout(`
      <h2>New Employer Access Request</h2>
      <p>An existing employee has requested employer access. Please review:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHtml(companyName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Requester</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(requesterName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(companyEmail)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(city)}, ${escapeHtml(state)}</td></tr>
      </table>
      ${ctaButton('Review in Admin Panel', `${APP_URL}/admin`)}
    `),
  };
}

// Employer access request approved (to requester)
export function employerAccessApprovedEmail(fullName: string, companyName: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  const employerUrl = APP_URL.includes('career') ? APP_URL.replace('career', 'employer') : APP_URL;
  return {
    subject: 'Your Employer Access Has Been Approved!',
    html: emailLayout(`
      <h2>Welcome to the Employer Portal! 🎉</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Great news! Your request to register <strong>${escapeHtml(companyName)}</strong> as an employer on Kraftworks has been <span style="color: #16a34a; font-weight: 600;">approved</span>.</p>
      <p>You can now access the Employer Portal to post jobs and manage applications.</p>
      ${ctaButton('Go to Employer Portal', employerUrl)}
    `),
  };
}

// Employer access request rejected (to requester)
export function employerAccessRejectedEmail(fullName: string, companyName: string, reason?: string): { subject: string; html: string } {
  const displayName = fullName?.trim() || 'there';
  return {
    subject: 'Update on Your Employer Access Request',
    html: emailLayout(`
      <h2>Employer Access Request Update</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>After reviewing your request to register <strong>${escapeHtml(companyName)}</strong>, we're unable to approve employer access at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
      <p>If you believe this was a mistake or have additional information, please contact us at <a href="mailto:info@kraftworks.com">info@kraftworks.com</a>.</p>
      ${ctaButton('Back to Dashboard', `${APP_URL}/dashboard`)}
    `),
  };
}
