import { Hono } from 'hono';
import type { Env, JobApplicationRow } from '../types';
import { sendEmail, applicationSubmittedEmail, newApplicationReceivedEmail, applicationWithdrawnEmail, applicationWithdrawnEmployerEmail } from '../lib/resend';

const jobs = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// POST /api/jobs/:id/apply - Apply to a job
jobs.post('/:id/apply', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('id');

  // Verify job exists and is active
  const job = await c.env.DB.prepare(
    "SELECT id, status FROM job_listings WHERE id = ? AND status = 'active'"
  ).bind(jobId).first();

  if (!job) return c.json({ error: 'Job not found or no longer accepting applications' }, 404);

  // Check for duplicate application
  const existing = await c.env.DB.prepare(
    'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?'
  ).bind(jobId, userId).first();

  if (existing) return c.json({ error: 'You have already applied to this job' }, 409);

  const body = await c.req.json().catch(() => ({}));
  const { resume_id, cover_letter } = body as any;

  // If resume_id provided, verify it belongs to user
  if (resume_id) {
    const resume = await c.env.DB.prepare(
      'SELECT id FROM resumes WHERE id = ? AND user_id = ?'
    ).bind(resume_id, userId).first();
    if (!resume) return c.json({ error: 'Resume not found' }, 400);
  }

  const appId = crypto.randomUUID().replace(/-/g, '');

  await c.env.DB.prepare(`
    INSERT INTO job_applications (id, job_id, user_id, resume_id, cover_letter)
    VALUES (?, ?, ?, ?, ?)
  `).bind(appId, jobId, userId, resume_id || null, cover_letter || null).run();

  // Email: applicant confirmation + employer notification
  try {
    const info = await c.env.DB.prepare(`
      SELECT j.title, c.company_name, c.company_email,
             u2.full_name as employer_name, u1.full_name as applicant_name, u1.email as applicant_email
      FROM job_listings j
      JOIN companies c ON j.company_id = c.id
      JOIN users u2 ON c.user_id = u2.id,
           users u1
      WHERE j.id = ? AND u1.id = ?
    `).bind(jobId, userId).first<{ title: string; company_name: string; company_email: string; employer_name: string; applicant_name: string; applicant_email: string }>();
    if (info) {
      const applicantTpl = applicationSubmittedEmail(info.applicant_name || 'there', info.title, info.company_name);
      sendEmail(c.env.RESEND_API_KEY, { to: info.applicant_email, subject: applicantTpl.subject, html: applicantTpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
      if (info.company_email) {
        const employerTpl = newApplicationReceivedEmail(info.employer_name || 'there', info.applicant_name || 'An applicant', info.title);
        sendEmail(c.env.RESEND_API_KEY, { to: info.company_email, subject: employerTpl.subject, html: employerTpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
      }
    }
  } catch { /* non-blocking */ }

  return c.json({ application: { id: appId, job_id: jobId, status: 'submitted' } }, 201);
});

// GET /api/jobs/:id/application-status - Check if user already applied to this job
jobs.get('/:id/application-status', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('id');

  const app = await c.env.DB.prepare(`
    SELECT a.id, a.status, a.created_at, a.updated_at, a.cover_letter,
           j.title as job_title, c.company_name
    FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.job_id = ? AND a.user_id = ?
  `).bind(jobId, userId).first();

  if (!app) return c.json({ applied: false });
  return c.json({ applied: true, application: app });
});

// GET /api/jobs/my-applications - List own applications
jobs.get('/my-applications', async (c) => {
  const userId = c.get('userId');

  const { results } = await c.env.DB.prepare(`
    SELECT a.*, j.title as job_title, j.trade_category, j.employment_type,
           j.city as job_city, j.state as job_state, j.status as job_status,
           c.company_name, c.company_logo_url, c.is_partner, c.is_verified
    FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).bind(userId).all();

  return c.json({ applications: results || [] });
});

// DELETE /api/jobs/applications/:id - Withdraw application
jobs.delete('/applications/:id', async (c) => {
  const userId = c.get('userId');
  const appId = c.req.param('id');

  const app = await c.env.DB.prepare(
    'SELECT * FROM job_applications WHERE id = ? AND user_id = ?'
  ).bind(appId, userId).first<JobApplicationRow>();

  if (!app) return c.json({ error: 'Application not found' }, 404);

  if (app.status !== 'submitted') {
    return c.json({ error: 'Can only withdraw applications with status "submitted"' }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE job_applications SET status = 'withdrawn', updated_at = datetime('now') WHERE id = ?"
  ).bind(appId).run();

  // Email: applicant withdrawal confirmation + employer notification
  try {
    const info = await c.env.DB.prepare(`
      SELECT j.title, c.company_name, c.company_email,
             u2.full_name as employer_name, u1.full_name as applicant_name, u1.email as applicant_email
      FROM job_applications a
      JOIN job_listings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      JOIN users u2 ON c.user_id = u2.id
      JOIN users u1 ON a.user_id = u1.id
      WHERE a.id = ?
    `).bind(appId).first<{ title: string; company_name: string; company_email: string; employer_name: string; applicant_name: string; applicant_email: string }>();
    if (info) {
      const applicantTpl = applicationWithdrawnEmail(info.applicant_name || 'there', info.title, info.company_name);
      sendEmail(c.env.RESEND_API_KEY, { to: info.applicant_email, subject: applicantTpl.subject, html: applicantTpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
      if (info.company_email) {
        const employerTpl = applicationWithdrawnEmployerEmail(info.employer_name || 'there', info.applicant_name || 'An applicant', info.title);
        sendEmail(c.env.RESEND_API_KEY, { to: info.company_email, subject: employerTpl.subject, html: employerTpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
      }
    }
  } catch { /* non-blocking */ }

  return c.json({ success: true });
});

export default jobs;
