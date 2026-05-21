import { Hono } from 'hono';
import type { Env, CompanyRow, JobListingRow, JobApplicationRow, UserRow, EmployerAccessRequestRow } from '../types';
import { employerGuard } from '../middleware/employerGuard';
import { sendEmail, companyRegistrationEmail, adminNewCompanyEmail, jobPostedEmail, applicationStatusUpdateEmail, employerAccessRequestSubmittedEmail, adminEmployerAccessRequestEmail } from '../lib/resend';
import { getAdminEmails } from '../lib/admin-notify';

const employer = new Hono<{ Bindings: Env; Variables: { userId: string; email?: string } }>();

// ==================== Employer Access Requests ====================
// Employees must request access before becoming employers.

// GET /api/employer/access-request - Check current user's access request status
employer.get('/access-request', async (c) => {
  const userId = c.get('userId');
  const request = await c.env.DB.prepare(
    'SELECT * FROM employer_access_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first<EmployerAccessRequestRow>();
  return c.json({ request: request || null });
});

// POST /api/employer/access-request - Submit request to become employer
employer.post('/access-request', async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('email');

  // Ensure user row exists (Clerk webhook may be delayed)
  const existingUser = await c.env.DB.prepare('SELECT id, email, full_name FROM users WHERE id = ?').bind(userId).first<UserRow>();
  if (!existingUser) {
    const placeholderEmail = userEmail || `${userId}@placeholder.kraftworks.app`;
    await c.env.DB.prepare(`
      INSERT INTO users (id, email) VALUES (?, ?)
    `).bind(userId, placeholderEmail).run();
  }

  // Check if already has employer role
  const role = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(userId).first<{ role: string }>();
  if (role?.role === 'employer' || role?.role === 'admin') {
    return c.json({ error: 'You already have employer access' }, 409);
  }

  // Check if already has a pending request
  const existing = await c.env.DB.prepare(
    "SELECT id FROM employer_access_requests WHERE user_id = ? AND status = 'pending'"
  ).bind(userId).first();
  if (existing) {
    return c.json({ error: 'You already have a pending request' }, 409);
  }

  const body = await c.req.json();
  const { company_name, company_email, company_phone, company_website,
          industry, company_size, description, city, state } = body;

  if (!company_name || !company_email || !city || !state) {
    return c.json({ error: 'company_name, company_email, city, and state are required' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company_email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  const requestId = crypto.randomUUID().replace(/-/g, '');

  try {
    await c.env.DB.prepare(`
      INSERT INTO employer_access_requests (id, user_id, company_name, company_email, company_phone,
        company_website, industry, company_size, description, city, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId, userId, company_name, company_email,
      company_phone || null, company_website || null,
      industry || null, company_size || null, description || null,
      city, state
    ).run();
  } catch (err) {
    console.error('[EMPLOYER ACCESS REQUEST FAILED]', err);
    return c.json({ error: 'Failed to save request. Please try again.' }, 500);
  }

  // Audit log (non-blocking)
  try {
    await c.env.DB.prepare(`
      INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, after_json)
      VALUES (?, ?, 'employer_access_request', ?, 'create', ?)
    `).bind(
      crypto.randomUUID().replace(/-/g, ''), userId, requestId,
      JSON.stringify({ company_name, company_email, city, state })
    ).run();
  } catch (err) {
    console.error('[AUDIT LOG FAILED]', err);
  }

  // Email: confirmation to requester + admin alert (non-blocking but logged)
  try {
    const user = existingUser || await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
    if (user?.email && !user.email.endsWith('@placeholder.kraftworks.app')) {
      const tpl = employerAccessRequestSubmittedEmail(user.full_name || 'there', company_name);
      const result = await sendEmail(c.env.RESEND_API_KEY, { to: user.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true');
      if (!result) console.error(`[EMAIL FAILED] access-request confirmation to=${user.email}`);
    }
    const adminEmails = await getAdminEmails(c.env.DB, c.env.ADMIN_EMAIL);
    console.log(`[ACCESS REQUEST] Notifying ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);
    if (adminEmails.length > 0) {
      const adminTpl = adminEmployerAccessRequestEmail(company_name, company_email, user?.full_name || 'Unknown', city, state);
      for (const adminEmail of adminEmails) {
        const result = await sendEmail(c.env.RESEND_API_KEY, { to: adminEmail, subject: adminTpl.subject, html: adminTpl.html }, c.env.SANDBOX_MODE === 'true');
        if (!result) console.error(`[ADMIN EMAIL FAILED] to=${adminEmail} subject=${adminTpl.subject}`);
        else console.log(`[ADMIN EMAIL OK] id=${result.id} to=${adminEmail}`);
      }
    } else {
      console.error('[ADMIN EMAIL] No admin emails found to notify!');
    }
  } catch (err) {
    console.error('[ACCESS REQUEST EMAIL ERROR]', err);
  }

  const request = await c.env.DB.prepare('SELECT * FROM employer_access_requests WHERE id = ?').bind(requestId).first();
  return c.json({ request }, 201);
});

// GET /api/employer/role-check - Check user's current role (for employer portal gating)
employer.get('/role-check', async (c) => {
  const userId = c.get('userId');
  const role = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(userId).first<{ role: string }>();
  const accessRequest = await c.env.DB.prepare(
    'SELECT * FROM employer_access_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first<EmployerAccessRequestRow>();
  return c.json({
    role: role?.role || 'user',
    accessRequest: accessRequest || null,
  });
});

// ==================== Company Profile ====================
// Note: GET & POST /company are open to any authenticated user (no employer guard)
// so users can check if they have a company and create one.
// All other routes require employer guard.

// GET /api/employer/company - Get own company profile
employer.get('/company', async (c) => {
  const userId = c.get('userId');
  const company = await c.env.DB.prepare(
    'SELECT * FROM companies WHERE user_id = ?'
  ).bind(userId).first<CompanyRow>();

  return c.json({ company: company || null });
});

// POST /api/employer/company - Create company profile + grant employer role
employer.post('/company', async (c) => {
  const userId = c.get('userId');

  // Block all non-employer/admin users from direct company creation — must go through access request flow
  const userRole = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(userId).first<{ role: string }>();
  if (userRole?.role !== 'employer' && userRole?.role !== 'admin') {
    return c.json({ error: 'You must be approved as an employer first. Please submit an access request.' }, 403);
  }

  // Check if already has a company
  const existing = await c.env.DB.prepare(
    'SELECT id FROM companies WHERE user_id = ?'
  ).bind(userId).first();
  if (existing) return c.json({ error: 'Company profile already exists' }, 409);

  const body = await c.req.json();
  const { company_name, company_email, company_phone, company_website, company_logo_url,
          industry, company_size, description, city, state } = body;

  if (!company_name || !company_email || !city || !state) {
    return c.json({ error: 'company_name, company_email, city, and state are required' }, 400);
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company_email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  const companyId = crypto.randomUUID().replace(/-/g, '');

  await c.env.DB.prepare(`
    INSERT INTO companies (id, user_id, company_name, company_email, company_phone, company_website,
      company_logo_url, industry, company_size, description, city, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    companyId, userId, company_name, company_email,
    company_phone || null, company_website || null, company_logo_url || null,
    industry || null, company_size || null, description || null,
    city, state
  ).run();

  // Grant 'employer' role
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO user_roles (user_id, role, granted_by) VALUES (?, 'employer', 'system')"
  ).bind(userId).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, after_json)
    VALUES (?, ?, 'company', ?, 'create', ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''), userId, companyId,
    JSON.stringify({ company_name, company_email, city, state })
  ).run();

  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first<CompanyRow>();

  // Email: employer confirmation + admin alert
  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
    if (user?.email) {
      const tpl = companyRegistrationEmail(user.full_name || 'there', company_name);
      sendEmail(c.env.RESEND_API_KEY, { to: user.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
    const adminEmails = await getAdminEmails(c.env.DB, c.env.ADMIN_EMAIL);
    if (adminEmails.length > 0) {
      const adminTpl = adminNewCompanyEmail(company_name, company_email, user?.full_name || 'Unknown', city, state);
      for (const adminEmail of adminEmails) {
        sendEmail(c.env.RESEND_API_KEY, { to: adminEmail, subject: adminTpl.subject, html: adminTpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
      }
    }
  } catch { /* non-blocking */ }

  return c.json({ company }, 201);
});

// PUT /api/employer/company - Update company profile
employer.put('/company', async (c) => {
  const userId = c.get('userId');
  const company = await c.env.DB.prepare(
    'SELECT * FROM companies WHERE user_id = ?'
  ).bind(userId).first<CompanyRow>();

  if (!company) return c.json({ error: 'Company profile not found' }, 404);

  const body = await c.req.json();
  const fields = ['company_name', 'company_email', 'company_phone', 'company_website',
    'company_logo_url', 'industry', 'company_size', 'description', 'city', 'state', 'internal_notes'];

  const updates: string[] = [];
  const values: any[] = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field] || null);
    }
  }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  updates.push("updated_at = datetime('now')");
  values.push(company.id);

  await c.env.DB.prepare(
    `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const updated = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(company.id).first<CompanyRow>();
  return c.json({ company: updated });
});

// ==================== Job Listings ====================
// All job routes require employer role
employer.use('/jobs/*', employerGuard);
employer.use('/jobs', employerGuard);
employer.use('/applications/*', employerGuard);
employer.use('/dashboard', employerGuard);

// GET /api/employer/jobs - List own job postings
employer.get('/jobs', async (c) => {
  const userId = c.get('userId');

  const company = await c.env.DB.prepare(
    'SELECT id FROM companies WHERE user_id = ?'
  ).bind(userId).first<{ id: string }>();

  if (!company) return c.json({ jobs: [] });

  const { results } = await c.env.DB.prepare(`
    SELECT j.*,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
    FROM job_listings j
    WHERE j.company_id = ?
    ORDER BY j.created_at DESC
  `).bind(company.id).all();

  const jobs = (results || []).map((r: any) => ({
    ...r,
    requirements: JSON.parse(r.requirements || '[]'),
    benefits: JSON.parse(r.benefits || '[]'),
  }));

  return c.json({ jobs });
});

// POST /api/employer/jobs - Create job listing
employer.post('/jobs', async (c) => {
  const userId = c.get('userId');

  const company = await c.env.DB.prepare(
    'SELECT * FROM companies WHERE user_id = ?'
  ).bind(userId).first<CompanyRow>();

  if (!company) return c.json({ error: 'Create a company profile first' }, 400);

  if ((company as any).status !== 'active') {
    return c.json({
      error: 'Your company profile is still pending admin review. You will receive an email notification once approved, then you can start posting jobs.'
    }, 403);
  }

  const body = await c.req.json();
  const { title, description, trade_category, employment_type, experience_level,
          salary_min, salary_max, salary_period, city, state, is_remote,
          requirements, benefits, application_deadline, status } = body;

  if (!title?.trim() || !description?.trim() || !trade_category || !employment_type || !city || !state) {
    return c.json({ error: 'title, description, trade_category, employment_type, city, and state are required' }, 400);
  }

  const validTrades = ['electrician', 'hvac', 'welding', 'plumbing', 'carpentry', 'general'];
  if (!validTrades.includes(trade_category)) {
    return c.json({ error: `trade_category must be one of: ${validTrades.join(', ')}` }, 400);
  }

  const validTypes = ['full_time', 'part_time', 'contract', 'apprenticeship'];
  if (!validTypes.includes(employment_type)) {
    return c.json({ error: `employment_type must be one of: ${validTypes.join(', ')}` }, 400);
  }

  const jobId = crypto.randomUUID().replace(/-/g, '');
  const jobStatus = status === 'draft' ? 'draft' : 'active';

  try {
    await c.env.DB.prepare(`
      INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category,
        employment_type, experience_level, salary_min, salary_max, salary_period, city, state,
        is_remote, requirements, benefits, application_deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      jobId, company.id, userId, title, description, trade_category,
      employment_type, experience_level || null,
      salary_min || null, salary_max || null, salary_period || null,
      city, state, is_remote ? 1 : 0,
      JSON.stringify(requirements || []),
      JSON.stringify(benefits || []),
      application_deadline || null,
      jobStatus
    ).run();
  } catch (err) {
    console.error('[EMPLOYER JOB CREATE FAILED]', err);
    return c.json({ error: `Failed to save job listing: ${(err as any)?.message || 'Unknown error'}` }, 500);
  }

  const job = await c.env.DB.prepare('SELECT * FROM job_listings WHERE id = ?').bind(jobId).first();

  // Email: job posted confirmation
  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
    if (user?.email) {
      const tpl = jobPostedEmail(user.full_name || 'there', title, jobStatus);
      sendEmail(c.env.RESEND_API_KEY, { to: user.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
  } catch { /* non-blocking */ }

  return c.json({
    job: {
      ...(job as any),
      requirements: JSON.parse((job as any).requirements || '[]'),
      benefits: JSON.parse((job as any).benefits || '[]'),
    }
  }, 201);
});

// GET /api/employer/jobs/:id - Get single job with application stats
employer.get('/jobs/:id', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('id');

  const job = await c.env.DB.prepare(`
    SELECT j.* FROM job_listings j
    JOIN companies co ON j.company_id = co.id
    WHERE j.id = ? AND co.user_id = ?
  `).bind(jobId, userId).first();

  if (!job) return c.json({ error: 'Job not found' }, 404);

  // Application stats
  const { results: stats } = await c.env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM job_applications WHERE job_id = ? GROUP BY status'
  ).bind(jobId).all();

  return c.json({
    job: {
      ...(job as any),
      requirements: JSON.parse((job as any).requirements || '[]'),
      benefits: JSON.parse((job as any).benefits || '[]'),
    },
    application_stats: stats || [],
  });
});

// PUT /api/employer/jobs/:id - Update job listing
employer.put('/jobs/:id', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT j.id FROM job_listings j
    JOIN companies co ON j.company_id = co.id
    WHERE j.id = ? AND co.user_id = ?
  `).bind(jobId, userId).first();

  if (!existing) return c.json({ error: 'Job not found' }, 404);

  const body = await c.req.json();
  const fields: Record<string, any> = {};
  const allowedFields = ['title', 'description', 'trade_category', 'employment_type',
    'experience_level', 'salary_min', 'salary_max', 'salary_period', 'city', 'state',
    'is_remote', 'application_deadline', 'status'];

  for (const f of allowedFields) {
    if (body[f] !== undefined) fields[f] = body[f];
  }

  // Handle JSON array fields
  if (body.requirements !== undefined) fields.requirements = JSON.stringify(body.requirements);
  if (body.benefits !== undefined) fields.benefits = JSON.stringify(body.benefits);
  if (body.is_remote !== undefined) fields.is_remote = body.is_remote ? 1 : 0;

  const setClauses = Object.keys(fields).map(k => `${k} = ?`);
  setClauses.push("updated_at = datetime('now')");
  const values = Object.values(fields);
  values.push(jobId);

  await c.env.DB.prepare(
    `UPDATE job_listings SET ${setClauses.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const updated = await c.env.DB.prepare('SELECT * FROM job_listings WHERE id = ?').bind(jobId).first();
  return c.json({
    job: {
      ...(updated as any),
      requirements: JSON.parse((updated as any).requirements || '[]'),
      benefits: JSON.parse((updated as any).benefits || '[]'),
    }
  });
});

// DELETE /api/employer/jobs/:id - Soft delete (set status to 'closed')
employer.delete('/jobs/:id', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT j.id FROM job_listings j
    JOIN companies co ON j.company_id = co.id
    WHERE j.id = ? AND co.user_id = ?
  `).bind(jobId, userId).first();

  if (!existing) return c.json({ error: 'Job not found' }, 404);

  await c.env.DB.prepare(
    "UPDATE job_listings SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
  ).bind(jobId).run();

  return c.json({ success: true });
});

// ==================== Applications ====================

// GET /api/employer/jobs/:id/applications - List applications for a job
employer.get('/jobs/:id/applications', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('id');

  // Verify ownership
  const job = await c.env.DB.prepare(`
    SELECT j.id FROM job_listings j
    JOIN companies co ON j.company_id = co.id
    WHERE j.id = ? AND co.user_id = ?
  `).bind(jobId, userId).first();

  if (!job) return c.json({ error: 'Job not found' }, 404);

  const { results } = await c.env.DB.prepare(`
    SELECT a.*, u.email as applicant_email, u.full_name as applicant_name,
           r.file_name as resume_file_name, r.id as resume_id
    FROM job_applications a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE a.job_id = ?
    ORDER BY a.created_at DESC
  `).bind(jobId).all();

  return c.json({ applications: results || [] });
});

// PATCH /api/employer/applications/:appId/status - Update application status
employer.patch('/applications/:appId/status', async (c) => {
  const userId = c.get('userId');
  const appId = c.req.param('appId');

  // Verify this application belongs to a job owned by this employer
  const app = await c.env.DB.prepare(`
    SELECT a.* FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    JOIN companies co ON j.company_id = co.id
    WHERE a.id = ? AND co.user_id = ?
  `).bind(appId, userId).first<JobApplicationRow>();

  if (!app) return c.json({ error: 'Application not found' }, 404);

  const body = await c.req.json();
  const { status, employer_notes } = body;

  const validStatuses = ['reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return c.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, 400);
  }

  const updates: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];

  if (status) { updates.unshift('status = ?'); values.push(status); }
  if (employer_notes !== undefined) { updates.unshift('employer_notes = ?'); values.push(employer_notes); }

  values.push(appId);

  await c.env.DB.prepare(
    `UPDATE job_applications SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  // Email: notify applicant of status change
  try {
    const info = await c.env.DB.prepare(`
      SELECT u.email, u.full_name, j.title, c.company_name
      FROM job_applications a
      JOIN users u ON a.user_id = u.id
      JOIN job_listings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = ?
    `).bind(appId).first<{ email: string; full_name: string; title: string; company_name: string }>();
    if (info?.email && status) {
      const tpl = applicationStatusUpdateEmail(info.full_name || 'there', info.title, info.company_name, status, employer_notes);
      sendEmail(c.env.RESEND_API_KEY, { to: info.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
  } catch { /* non-blocking */ }

  return c.json({ success: true });
});

// ==================== Dashboard ====================

// GET /api/employer/dashboard - Employer stats (rich analytics)
employer.get('/dashboard', async (c) => {
  const userId = c.get('userId');

  const company = await c.env.DB.prepare(
    'SELECT * FROM companies WHERE user_id = ?'
  ).bind(userId).first<CompanyRow>();

  if (!company) return c.json({ company: null, stats: null });

  // Core counts
  const totalJobs = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM job_listings WHERE company_id = ?'
  ).bind(company.id).first<{ count: number }>();

  const activeJobs = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM job_listings WHERE company_id = ? AND status = 'active'"
  ).bind(company.id).first<{ count: number }>();

  const totalApps = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    WHERE j.company_id = ?
  `).bind(company.id).first<{ count: number }>();

  const pendingApps = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    WHERE j.company_id = ? AND a.status = 'submitted'
  `).bind(company.id).first<{ count: number }>();

  // Total views across all jobs
  const totalViews = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(views_count), 0) as count FROM job_listings WHERE company_id = ?'
  ).bind(company.id).first<{ count: number }>();

  // Application pipeline breakdown
  const { results: pipelineRaw } = await c.env.DB.prepare(`
    SELECT a.status, COUNT(*) as count
    FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    WHERE j.company_id = ?
    GROUP BY a.status
  `).bind(company.id).all();
  const pipeline: Record<string, number> = {};
  for (const r of (pipelineRaw || []) as any[]) {
    pipeline[r.status] = r.count;
  }

  // Jobs by status breakdown
  const { results: jobsByStatusRaw } = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as count FROM job_listings WHERE company_id = ? GROUP BY status
  `).bind(company.id).all();
  const jobs_by_status: Record<string, number> = {};
  for (const r of (jobsByStatusRaw || []) as any[]) {
    jobs_by_status[r.status] = r.count;
  }

  // Jobs by trade category
  const { results: jobsByTradeRaw } = await c.env.DB.prepare(`
    SELECT trade_category, COUNT(*) as count FROM job_listings WHERE company_id = ? GROUP BY trade_category
  `).bind(company.id).all();
  const jobs_by_trade: Record<string, number> = {};
  for (const r of (jobsByTradeRaw || []) as any[]) {
    jobs_by_trade[r.trade_category] = r.count;
  }

  // Top jobs by application count
  const { results: topJobs } = await c.env.DB.prepare(`
    SELECT j.id, j.title, j.trade_category, j.status, j.views_count,
      j.application_deadline, j.created_at,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
    FROM job_listings j
    WHERE j.company_id = ?
    ORDER BY application_count DESC
    LIMIT 5
  `).bind(company.id).all();

  // Jobs needing attention: no applications + active, or expired deadline
  const { results: attentionJobs } = await c.env.DB.prepare(`
    SELECT j.id, j.title, j.status, j.application_deadline, j.views_count,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
    FROM job_listings j
    WHERE j.company_id = ? AND j.status = 'active'
      AND ((SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) = 0
           OR (j.application_deadline IS NOT NULL AND j.application_deadline < datetime('now')))
    ORDER BY j.created_at DESC LIMIT 5
  `).bind(company.id).all();

  // Recent applications
  const { results: recentApps } = await c.env.DB.prepare(`
    SELECT a.*, u.email as applicant_email, u.full_name as applicant_name,
           j.title as job_title, j.trade_category as job_trade
    FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    JOIN users u ON a.user_id = u.id
    WHERE j.company_id = ?
    ORDER BY a.created_at DESC LIMIT 10
  `).bind(company.id).all();

  return c.json({
    company,
    stats: {
      total_jobs: totalJobs?.count || 0,
      active_jobs: activeJobs?.count || 0,
      total_applications: totalApps?.count || 0,
      pending_applications: pendingApps?.count || 0,
      total_views: totalViews?.count || 0,
    },
    pipeline,
    jobs_by_status,
    jobs_by_trade,
    top_jobs: topJobs || [],
    attention_jobs: attentionJobs || [],
    recent_applications: recentApps || [],
  });
});

export default employer;
