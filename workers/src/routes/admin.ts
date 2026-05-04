import { Hono } from 'hono';
import type { Env, ResumeFeedbackRow, TradeGradWaitlistRow, EmployerWaitlistRow, ContactSubmissionRow, AuditLogRow, UserRow, NewsletterSubscriberRow, EmployerAccessRequestRow } from '../types';
import { sendEmail, companyApprovedEmail, companySuspendedEmail, creditsUpdatedEmail, employerAccessApprovedEmail, employerAccessRejectedEmail } from '../lib/resend';

const admin = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// GET /api/admin/feedback/queue - List all feedback (pending first)
admin.get('/feedback/queue', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT rf.*, r.file_name as resume_file_name, u.email as user_email, u.full_name as user_full_name
    FROM resume_feedback rf
    LEFT JOIN resumes r ON rf.resume_id = r.id
    LEFT JOIN users u ON rf.user_id = u.id
    ORDER BY 
      CASE rf.status WHEN 'pending_review' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 END,
      rf.created_at DESC
  `).all();

  const parsed = (results || []).map((r: any) => ({
    ...r,
    strengths: JSON.parse(r.strengths || '[]'),
    improvements: JSON.parse(r.improvements || '[]'),
    suggestions: JSON.parse(r.suggestions || '[]'),
    trade_suggestions: JSON.parse(r.trade_suggestions || '[]'),
    actionable_steps: JSON.parse(r.actionable_steps || '[]'),
  }));

  return c.json({ feedback: parsed });
});

// PATCH /api/admin/feedback/edit/:id - Edit feedback fields
admin.patch('/feedback/edit/:id', async (c) => {
  const feedbackId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json<{
    strengths?: string[];
    improvements?: string[];
    suggestions?: string[];
    trade_suggestions?: string[];
    actionable_steps?: string[];
    overall_score?: number;
  }>();

  const existing = await c.env.DB.prepare(
    'SELECT * FROM resume_feedback WHERE id = ?'
  ).bind(feedbackId).first<ResumeFeedbackRow>();

  if (!existing) return c.json({ error: 'Feedback not found' }, 404);

  const updates: string[] = [];
  const values: any[] = [];

  if (body.strengths) { updates.push('strengths = ?'); values.push(JSON.stringify(body.strengths)); }
  if (body.improvements) { updates.push('improvements = ?'); values.push(JSON.stringify(body.improvements)); }
  if (body.suggestions) { updates.push('suggestions = ?'); values.push(JSON.stringify(body.suggestions)); }
  if (body.trade_suggestions) { updates.push('trade_suggestions = ?'); values.push(JSON.stringify(body.trade_suggestions)); }
  if (body.actionable_steps) { updates.push('actionable_steps = ?'); values.push(JSON.stringify(body.actionable_steps)); }
  if (body.overall_score !== undefined) { updates.push('overall_score = ?'); values.push(body.overall_score); }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  updates.push("updated_at = datetime('now')");

  await c.env.DB.prepare(
    `UPDATE resume_feedback SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values, feedbackId).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'resume_feedback', ?, 'edit', ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''),
    userId,
    feedbackId,
    JSON.stringify({ overall_score: existing.overall_score }),
    JSON.stringify(body),
  ).run();

  return c.json({ success: true });
});

// GET /api/admin/feedback/export - CSV export of all feedback
admin.get('/feedback/export', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT rf.*, r.file_name as resume_file_name, u.email as user_email
    FROM resume_feedback rf
    LEFT JOIN resumes r ON rf.resume_id = r.id
    LEFT JOIN users u ON rf.user_id = u.id
    ORDER BY rf.created_at DESC
  `).all();

  const headers = ['User Email', 'Resume', 'Score', 'Strengths', 'Improvements', 'Suggestions', 'Trade Suggestions', 'Actionable Steps', 'Status', 'Date'];
  const rows = (results || []).map((r: any) => [
    r.user_email || '',
    r.resume_file_name || '',
    String(r.overall_score ?? ''),
    JSON.parse(r.strengths || '[]').join('; '),
    JSON.parse(r.improvements || '[]').join('; '),
    JSON.parse(r.suggestions || '[]').join('; '),
    JSON.parse(r.trade_suggestions || '[]').join('; '),
    JSON.parse(r.actionable_steps || '[]').join('; '),
    r.status,
    r.created_at,
  ]);

  const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=resume_feedback.csv',
    },
  });
});

// GET /api/admin/resume/download/:resumeId - Generate signed URL for resume download
admin.get('/resume/download/:resumeId', async (c) => {
  const resumeId = c.req.param('resumeId');

  const resume = await c.env.DB.prepare(
    'SELECT * FROM resumes WHERE id = ?'
  ).bind(resumeId).first<{ file_path: string; file_name: string }>();

  if (!resume) return c.json({ error: 'Resume not found' }, 404);

  const r2Object = await c.env.RESUMES_BUCKET.get(resume.file_path);
  if (!r2Object) return c.json({ error: 'File not found in storage' }, 404);

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${resume.file_name}"`);

  return new Response(r2Object.body, { headers });
});

// GET /api/admin/waitlist/trade-grads - List trade grad waitlist
admin.get('/waitlist/trade-grads', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM trade_grad_waitlist ORDER BY created_at DESC'
  ).all<TradeGradWaitlistRow>();
  return c.json({ tradeGrads: results || [] });
});

// GET /api/admin/waitlist/employers - List employer waitlist
admin.get('/waitlist/employers', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM employer_waitlist ORDER BY created_at DESC'
  ).all<EmployerWaitlistRow>();
  return c.json({ employers: results || [] });
});

// GET /api/admin/waitlist/export - Export waitlists as CSV
admin.get('/waitlist/export', async (c) => {
  const type = c.req.query('type') || 'trade_grads';

  if (type === 'employers') {
    const { results } = await c.env.DB.prepare('SELECT * FROM employer_waitlist ORDER BY created_at DESC').all();
    const headers = ['Full Name', 'Job Title', 'Company Email', 'Trades Hiring For', 'Hiring Volume', 'State', 'City', 'Date'];
    const rows = (results || []).map((r: any) => [r.full_name, r.job_title, r.company_email, r.trades_hiring_for, r.hiring_volume, r.state, r.city, r.created_at]);
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    return new Response(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=employer_waitlist.csv' },
    });
  }

  const { results } = await c.env.DB.prepare('SELECT * FROM trade_grad_waitlist ORDER BY created_at DESC').all();
  const headers = ['Full Name', 'Email', 'Trade Program', 'State', 'City', 'Date'];
  const rows = (results || []).map((r: any) => [r.full_name, r.email, r.trade_program, r.state, r.city, r.created_at]);
  const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=trade_grad_waitlist.csv' },
  });
});

// GET /api/admin/contacts - List contact submissions
admin.get('/contacts', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM contact_submissions ORDER BY created_at DESC'
  ).all<ContactSubmissionRow>();
  return c.json({ contacts: results || [] });
});

// PATCH /api/admin/contacts/:id/status - Update contact status
admin.patch('/contacts/:id/status', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId') as string;
  const { status } = await c.req.json<{ status: string }>();

  const validStatuses = ['new', 'in_progress', 'resolved'];
  if (!validStatuses.includes(status)) {
    return c.json({ error: 'Invalid status. Must be: new, in_progress, or resolved' }, 400);
  }

  // Note: We use in_progress/resolved (schema updated from original reviewed/closed)

  const existing = await c.env.DB.prepare(
    'SELECT id, status FROM contact_submissions WHERE id = ?'
  ).bind(id).first<ContactSubmissionRow>();
  if (!existing) return c.json({ error: 'Contact submission not found' }, 404);

  const oldStatus = existing.status;
  await c.env.DB.prepare(
    'UPDATE contact_submissions SET status = ? WHERE id = ?'
  ).bind(status, id).run();

  // Audit log
  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    crypto.randomUUID().replace(/-/g, ''), userId, 'contact_submission', id, 'update_status',
    JSON.stringify({ status: oldStatus }), JSON.stringify({ status })
  ).run();

  return c.json({ ok: true });
});

// GET /api/admin/audit-log - List audit log entries
admin.get('/audit-log', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 200'
  ).all<AuditLogRow>();
  return c.json({ auditLogs: results || [] });
});

// DELETE /api/admin/waitlist/trade-grads/:id
admin.delete('/waitlist/trade-grads/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM trade_grad_waitlist WHERE id = ?'
  ).bind(id).first();
  if (!existing) return c.json({ error: 'Entry not found' }, 404);

  await c.env.DB.prepare('DELETE FROM trade_grad_waitlist WHERE id = ?').bind(id).run();

  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), userId, 'trade_grad_waitlist', id, 'delete').run();

  return c.json({ success: true });
});

// DELETE /api/admin/waitlist/employers/:id
admin.delete('/waitlist/employers/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM employer_waitlist WHERE id = ?'
  ).bind(id).first();
  if (!existing) return c.json({ error: 'Entry not found' }, 404);

  await c.env.DB.prepare('DELETE FROM employer_waitlist WHERE id = ?').bind(id).run();

  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), userId, 'employer_waitlist', id, 'delete').run();

  return c.json({ success: true });
});

// GET /api/admin/newsletter/subscribers - List newsletter subscribers
admin.get('/newsletter/subscribers', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM newsletter_subscribers ORDER BY created_at DESC'
  ).all<NewsletterSubscriberRow>();
  return c.json({ subscribers: results });
});

// DELETE /api/admin/newsletter/subscribers/:id
admin.delete('/newsletter/subscribers/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM newsletter_subscribers WHERE id = ?'
  ).bind(id).first();
  if (!existing) return c.json({ error: 'Entry not found' }, 404);

  await c.env.DB.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').bind(id).run();

  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), userId, 'newsletter_subscribers', id, 'delete').run();

  return c.json({ success: true });
});

// GET /api/admin/newsletter/export - Export subscribers as CSV
admin.get('/newsletter/export', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC').all();
  const csv = [
    ['id', 'email', 'source', 'created_at'].join(','),
    ...(results || []).map((r: any) => [r.id, r.email, r.source, r.created_at].join(',')),
  ].join('\n');
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=newsletter_subscribers.csv' },
  });
});

// DELETE /api/admin/contacts/:id
admin.delete('/contacts/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM contact_submissions WHERE id = ?'
  ).bind(id).first();
  if (!existing) return c.json({ error: 'Contact not found' }, 404);

  await c.env.DB.prepare('DELETE FROM contact_submissions WHERE id = ?').bind(id).run();

  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), userId, 'contact_submission', id, 'delete').run();

  return c.json({ success: true });
});

// GET /api/admin/users/lookup - Look up user(s) by email (supports partial match)
admin.get('/users/lookup', async (c) => {
  const email = c.req.query('email');

  if (!email || !email.includes('@')) {
    return c.json({ error: 'email query parameter required (must be a valid email)' }, 400);
  }

  const exactMatch = await c.env.DB.prepare(
    'SELECT id, email, full_name, created_at FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<UserRow>();

  if (exactMatch) {
    const role = await c.env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ?'
    ).bind(exactMatch.id).first<{ role: string }>();
    return c.json({
      user: {
        ...exactMatch,
        role: role?.role || 'user',
      },
      matchType: 'exact',
    });
  }

  // Partial match search
  const partial = await c.env.DB.prepare(
    "SELECT id, email, full_name, created_at FROM users WHERE email LIKE ? ORDER BY created_at DESC LIMIT 10"
  ).bind(`%${email}%`).all<UserRow>();

  return c.json({ user: null, matchType: 'none', partialMatches: partial.results || [] });
});

// POST /api/admin/roles - Grant admin role
// Accepts user_id OR email (looks up user_id from email if email is provided)
admin.post('/roles', async (c) => {
  const actorId = c.get('userId');
  const body = await c.req.json<{ user_id?: string; email?: string }>();
  const { user_id: targetUserId, email } = body;

  // If email is provided, look up the user_id first
  let resolvedUserId = targetUserId;
  if (!resolvedUserId && email) {
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first<{ id: string }>();
    if (!user) return c.json({ error: 'No user found with that email' }, 404);
    resolvedUserId = user.id;
  }

  if (!resolvedUserId?.trim()) {
    return c.json({ error: 'user_id or email is required' }, 400);
  }

  const userExists = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(resolvedUserId).first();
  if (!userExists) return c.json({ error: 'User not found' }, 404);

  const existing = await c.env.DB.prepare(
    'SELECT id FROM user_roles WHERE user_id = ? AND role = ?'
  ).bind(resolvedUserId, 'admin').first();
  if (existing) return c.json({ error: 'User already has admin role' }, 409);

  await c.env.DB.prepare(
    'INSERT INTO user_roles (id, user_id, role, granted_by) VALUES (?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), resolvedUserId, 'admin', actorId).run();

  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), actorId, 'user_role', resolvedUserId, 'grant_admin').run();

  return c.json({ success: true, user_id: resolvedUserId });
});

// DELETE /api/admin/roles/:userId - Revoke admin role
admin.delete('/roles/:userId', async (c) => {
  const actorId = c.get('userId');
  const targetUserId = c.req.param('userId');

  if (actorId === targetUserId) return c.json({ error: 'Cannot remove your own admin role' }, 400);

  const existing = await c.env.DB.prepare(
    'SELECT id FROM user_roles WHERE user_id = ? AND role = ?'
  ).bind(targetUserId, 'admin').first();
  if (!existing) return c.json({ error: 'User does not have admin role' }, 404);

  await c.env.DB.prepare(
    'DELETE FROM user_roles WHERE user_id = ? AND role = ?'
  ).bind(targetUserId, 'admin').run();

  await c.env.DB.prepare(
    'INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID().replace(/-/g, ''), actorId, 'user_role', targetUserId, 'revoke_admin').run();

  return c.json({ success: true });
});

// PATCH /api/admin/users/:userId/role - Set user role (user, employee, employer, admin)
admin.patch('/users/:userId/role', async (c) => {
  const actorId = c.get('userId');
  const targetUserId = c.req.param('userId');
  const { role } = await c.req.json<{ role: string }>();

  const validRoles = ['user', 'employee', 'employer', 'admin'];
  if (!validRoles.includes(role)) {
    return c.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, 400);
  }

  if (role === 'admin' && actorId === targetUserId) {
    return c.json({ error: 'Cannot change your own admin role' }, 400);
  }

  const userExists = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(targetUserId).first();
  if (!userExists) return c.json({ error: 'User not found' }, 404);

  const currentRole = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(targetUserId).first<{ role: string }>();
  const oldRole = currentRole?.role || 'user';

  // Remove existing role row
  await c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(targetUserId).run();

  // Insert new role (skip for default 'user' — absence means user)
  if (role !== 'user') {
    await c.env.DB.prepare(
      'INSERT INTO user_roles (user_id, role, granted_by) VALUES (?, ?, ?)'
    ).bind(targetUserId, role, actorId).run();
  }

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'user_role', ?, 'set_role', ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''),
    actorId,
    targetUserId,
    JSON.stringify({ role: oldRole }),
    JSON.stringify({ role }),
  ).run();

  return c.json({ success: true, role });
});

// PATCH /api/admin/users/:userId/credits - Set user credit limit
admin.patch('/users/:userId/credits', async (c) => {
  const actorId = c.get('userId');
  const targetUserId = c.req.param('userId');
  const { credit_limit: newCreditLimit, notify } = await c.req.json<{ credit_limit: number; notify?: boolean }>();

  if (typeof newCreditLimit !== 'number' || newCreditLimit < 0 || newCreditLimit > 999) {
    return c.json({ error: 'credit_limit must be a number between 0 and 999' }, 400);
  }

  const [userRow, usageCount] = await Promise.all([
    c.env.DB.prepare('SELECT id, email, full_name, credit_limit, credit_used_adj FROM users WHERE id = ?').bind(targetUserId).first<{ id: string; email: string; full_name: string | null; credit_limit: number; credit_used_adj: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ?').bind(targetUserId).first<{ count: number }>(),
  ]);
  if (!userRow) return c.json({ error: 'User not found' }, 404);

  const actualUsed = usageCount?.count ?? 0;
  const oldCreditLimit = userRow.credit_limit ?? 3;

  // Update credit_limit and reset credit_used_adj so effective used starts from 0
  const newAdj = -actualUsed;
  await c.env.DB.prepare(
    "UPDATE users SET credit_limit = ?, credit_used_adj = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(newCreditLimit, newAdj, targetUserId).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'user', ?, 'set_credit_limit', ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''),
    actorId,
    targetUserId,
    JSON.stringify({ credit_limit: oldCreditLimit }),
    JSON.stringify({ credit_limit: newCreditLimit }),
  ).run();

  // Send notification email if requested
  let emailError: string | null = null;
  if (notify && oldCreditLimit !== newCreditLimit) {
    const oldEffectiveUsed = Math.max(0, actualUsed + (userRow.credit_used_adj ?? 0));
    const oldAvailable = Math.max(0, oldCreditLimit - oldEffectiveUsed);
    const newAvailable = newCreditLimit; // Reset means full credits available
    const tpl = creditsUpdatedEmail(userRow.full_name || userRow.email, oldAvailable, newAvailable);
    const result = await sendEmail(c.env.RESEND_API_KEY, { to: userRow.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true');
    if (!result) emailError = 'Failed to send notification email. Check Resend domain verification and API key.';
  }

  return c.json({ success: true, credit_limit: newCreditLimit, ...(emailError ? { emailError } : {}) });
});

// PATCH /api/admin/users/:userId/credits-used - Adjust user AI credits used count
admin.patch('/users/:userId/credits-used', async (c) => {
  const actorId = c.get('userId');
  const targetUserId = c.req.param('userId');
  const { ai_actions_used: newUsedCount, notify } = await c.req.json<{ ai_actions_used: number; notify?: boolean }>();

  if (typeof newUsedCount !== 'number' || newUsedCount < 0 || newUsedCount > 999) {
    return c.json({ error: 'ai_actions_used must be a number between 0 and 999' }, 400);
  }

  const [userRow, usageCount] = await Promise.all([
    c.env.DB.prepare('SELECT id, email, full_name, credit_limit, credit_used_adj FROM users WHERE id = ?').bind(targetUserId).first<{ id: string; email: string; full_name: string | null; credit_limit: number; credit_used_adj: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ?').bind(targetUserId).first<{ count: number }>(),
  ]);
  if (!userRow) return c.json({ error: 'User not found' }, 404);

  const actualUsed = usageCount?.count ?? 0;
  const oldEffectiveUsed = Math.max(0, actualUsed + (userRow.credit_used_adj ?? 0));
  const newAdj = newUsedCount - actualUsed;

  await c.env.DB.prepare(
    "UPDATE users SET credit_used_adj = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(newAdj, targetUserId).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'user', ?, 'set_credits_used', ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''),
    actorId,
    targetUserId,
    JSON.stringify({ ai_actions_used: oldEffectiveUsed }),
    JSON.stringify({ ai_actions_used: newUsedCount }),
  ).run();

  // Send notification email if requested
  let emailError: string | null = null;
  if (notify && oldEffectiveUsed !== newUsedCount) {
    const creditLimit = userRow.credit_limit ?? 3;
    const oldAvailable = Math.max(0, creditLimit - oldEffectiveUsed);
    const newAvailable = Math.max(0, creditLimit - newUsedCount);
    const tpl = creditsUpdatedEmail(userRow.full_name || userRow.email, oldAvailable, newAvailable);
    const result = await sendEmail(c.env.RESEND_API_KEY, { to: userRow.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true');
    if (!result) emailError = 'Failed to send notification email.';
  }

  return c.json({ success: true, ai_actions_used: newUsedCount, ...(emailError ? { emailError } : {}) });
});

// ==================== User Management ====================

// GET /api/admin/users - List all users with summary stats
admin.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.created_at,
      u.credit_limit,
      u.disabled,
      COALESCE(ur.role, 'user') as role,
      (SELECT COUNT(*) FROM resumes r WHERE r.user_id = u.id) as resume_count,
      (SELECT COUNT(*) FROM resume_feedback rf WHERE rf.user_id = u.id) as feedback_count,
      (SELECT COUNT(*) FROM interview_questions iq WHERE iq.user_id = u.id) as questions_count,
      MAX(0, (SELECT COUNT(*) FROM ai_usage au WHERE au.user_id = u.id) + COALESCE(u.credit_used_adj, 0)) as ai_actions_used
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    ORDER BY u.created_at DESC
  `).all();

  return c.json({ users: results || [] });
});

// GET /api/admin/users/export - CSV export of all users
admin.get('/users/export', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      u.id, u.email, u.full_name, u.created_at, u.credit_limit,
      COALESCE(ur.role, 'user') as role,
      (SELECT COUNT(*) FROM resumes r WHERE r.user_id = u.id) as resume_count,
      MAX(0, (SELECT COUNT(*) FROM ai_usage au WHERE au.user_id = u.id) + COALESCE(u.credit_used_adj, 0)) as ai_actions_used
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    ORDER BY u.created_at DESC
  `).all();

  const headers = ['ID', 'Email', 'Full Name', 'Role', 'Resumes', 'AI Actions', 'Joined'];
  const rows = (results || []).map((r: any) => [
    r.id, r.email, r.full_name || '', r.role || 'user',
    String(r.resume_count ?? 0), String(r.ai_actions_used ?? 0), r.created_at,
  ]);

  const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=users.csv',
    },
  });
});

// POST /api/admin/test-email - Send a test email to verify Resend configuration
admin.post('/test-email', async (c) => {
  const actorId = c.get('userId');
  const { to } = await c.req.json<{ to: string }>();

  if (!to || !to.includes('@')) {
    return c.json({ error: 'Valid email address required' }, 400);
  }

  const isSandbox = c.env.SANDBOX_MODE === 'true';
  const apiKey = c.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return c.json({ error: 'RESEND_API_KEY is not configured. Run: wrangler secret put RESEND_API_KEY' }, 500);
  }

  if (isSandbox || apiKey === 'sandbox') {
    return c.json({ success: true, message: 'SANDBOX_MODE is enabled — emails are logged, not sent. Set SANDBOX_MODE=false in wrangler.toml to send real emails.', sandbox: true });
  }

  // Try sending a test email directly and capture the full response
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kraftworks <career@kraftworks.app>',
        to,
        subject: 'Kraftworks Test Email',
        html: '<h2>Test Email</h2><p>If you are reading this, Resend email delivery is working correctly.</p><p>Sent from Kraftworks Admin Panel.</p>',
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      return c.json({
        success: false,
        status: response.status,
        error: body,
        hint: response.status === 403
          ? 'API key may be invalid or a test key. Check https://resend.com/api-keys'
          : response.status === 422
            ? 'Domain "mahmudasrul.com" may not be verified on Resend. Go to https://resend.com/domains to add and verify your domain DNS records (SPF, DKIM).'
            : 'Check the error message above.',
      }, 200);
    }

    return c.json({ success: true, message: `Test email sent to ${to}`, response: JSON.parse(body) });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || 'Network error sending email' }, 500);
  }
});

// GET /api/admin/users/:userId - Single user full detail
admin.get('/users/:userId', async (c) => {
  const targetUserId = c.req.param('userId');

  // User profile + role
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(targetUserId).first<UserRow>();

  if (!user) return c.json({ error: 'User not found' }, 404);

  const roleRow = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(targetUserId).first<{ role: string }>();

  // Resumes
  const { results: resumes } = await c.env.DB.prepare(
    'SELECT id, file_name, file_size, trade_program, is_active, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(targetUserId).all();

  // Feedback
  const { results: feedbackRaw } = await c.env.DB.prepare(
    'SELECT * FROM resume_feedback WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(targetUserId).all();

  const feedback = (feedbackRaw || []).map((r: any) => ({
    ...r,
    strengths: JSON.parse(r.strengths || '[]'),
    improvements: JSON.parse(r.improvements || '[]'),
    suggestions: JSON.parse(r.suggestions || '[]'),
    trade_suggestions: JSON.parse(r.trade_suggestions || '[]'),
    actionable_steps: JSON.parse(r.actionable_steps || '[]'),
  }));

  // Interview questions
  const { results: questionsRaw } = await c.env.DB.prepare(
    'SELECT * FROM interview_questions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(targetUserId).all();

  const questions = (questionsRaw || []).map((r: any) => ({
    ...r,
    technical: JSON.parse(r.technical || '[]'),
    behavioral: JSON.parse(r.behavioral || '[]'),
    situational: JSON.parse(r.situational || '[]'),
    recommended_resources: JSON.parse(r.recommended_resources || '[]'),
  }));

  // AI usage
  const { results: aiUsage } = await c.env.DB.prepare(
    'SELECT * FROM ai_usage WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(targetUserId).all();

  // Calculate effective used count (raw count + adjustment)
  const aiUsageCount = (aiUsage || []).length;
  const effectiveUsed = Math.max(0, aiUsageCount + ((user as any).credit_used_adj ?? 0));

  // Waitlist cross-reference by email
  const tradeGradMatch = await c.env.DB.prepare(
    'SELECT * FROM trade_grad_waitlist WHERE email = ?'
  ).bind(user.email).first();

  const employerMatch = await c.env.DB.prepare(
    'SELECT * FROM employer_waitlist WHERE company_email = ?'
  ).bind(user.email).first();

  return c.json({
    user: {
      ...user,
      role: roleRow?.role || 'user',
      ai_actions_used: effectiveUsed,
    },
    resumes: resumes || [],
    feedback,
    questions,
    aiUsage: aiUsage || [],
    waitlistMatch: {
      tradeGrad: tradeGradMatch || null,
      employer: employerMatch || null,
    },
  });
});

// ==================== Employer Access Requests ====================

// GET /api/admin/employer-requests - List all employer access requests
admin.get('/employer-requests', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT r.*, u.email as user_email, u.full_name as user_full_name
    FROM employer_access_requests r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY
      CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 END,
      r.created_at DESC
  `).all();
  return c.json({ requests: results || [] });
});

// PATCH /api/admin/employer-requests/:id/approve - Approve request
admin.patch('/employer-requests/:id/approve', async (c) => {
  const reqId = c.req.param('id');
  const actorId = c.get('userId');

  const request = await c.env.DB.prepare(
    'SELECT * FROM employer_access_requests WHERE id = ?'
  ).bind(reqId).first<EmployerAccessRequestRow>();
  if (!request) return c.json({ error: 'Request not found' }, 404);
  if (request.status !== 'pending') return c.json({ error: 'Request already processed' }, 409);

  // Create company from request data (set status to 'active' since admin just approved)
  const companyId = crypto.randomUUID().replace(/-/g, '');
  await c.env.DB.prepare(`
    INSERT INTO companies (id, user_id, company_name, company_email, company_phone, company_website,
      company_logo_url, industry, company_size, description, city, state, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(
    companyId, request.user_id, request.company_name, request.company_email,
    request.company_phone || null, request.company_website || null, null,
    request.industry || null, request.company_size || null, request.description || null,
    request.city, request.state
  ).run();

  // Grant employer role (replace existing role)
  await c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(request.user_id).run();
  await c.env.DB.prepare(
    "INSERT INTO user_roles (user_id, role, granted_by) VALUES (?, 'employer', ?)"
  ).bind(request.user_id, actorId).run();

  // Update request status
  await c.env.DB.prepare(
    "UPDATE employer_access_requests SET status = 'approved', reviewed_by = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(actorId, reqId).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'employer_access_request', ?, 'approve', ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''), actorId, reqId,
    JSON.stringify({ status: 'pending' }),
    JSON.stringify({ status: 'approved', company_id: companyId })
  ).run();

  // Email: notify requester
  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(request.user_id).first<UserRow>();
    if (user?.email) {
      const tpl = employerAccessApprovedEmail(user.full_name || 'there', request.company_name);
      sendEmail(c.env.RESEND_API_KEY, { to: user.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
  } catch { /* non-blocking */ }

  return c.json({ success: true });
});

// PATCH /api/admin/employer-requests/:id/reject - Reject request
admin.patch('/employer-requests/:id/reject', async (c) => {
  const reqId = c.req.param('id');
  const actorId = c.get('userId');
  const body = await c.req.json().catch(() => ({}));
  const adminNotes = (body as any).admin_notes || '';

  const request = await c.env.DB.prepare(
    'SELECT * FROM employer_access_requests WHERE id = ?'
  ).bind(reqId).first<EmployerAccessRequestRow>();
  if (!request) return c.json({ error: 'Request not found' }, 404);
  if (request.status !== 'pending') return c.json({ error: 'Request already processed' }, 409);

  // Update request status
  await c.env.DB.prepare(
    "UPDATE employer_access_requests SET status = 'rejected', admin_notes = ?, reviewed_by = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(adminNotes || null, actorId, reqId).run();

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'employer_access_request', ?, 'reject', ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''), actorId, reqId,
    JSON.stringify({ status: 'pending' }),
    JSON.stringify({ status: 'rejected', admin_notes: adminNotes })
  ).run();

  // Email: notify requester
  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(request.user_id).first<UserRow>();
    if (user?.email) {
      const tpl = employerAccessRejectedEmail(user.full_name || 'there', request.company_name, adminNotes);
      sendEmail(c.env.RESEND_API_KEY, { to: user.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
  } catch { /* non-blocking */ }

  return c.json({ success: true });
});

// ==================== Career Fair Admin ====================

// GET /api/admin/companies - List all companies
admin.get('/companies', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT co.*, u.email as owner_email, u.full_name as owner_name,
      (SELECT COUNT(*) FROM job_listings WHERE company_id = co.id) as job_count
    FROM companies co
    LEFT JOIN users u ON co.user_id = u.id
    ORDER BY co.created_at DESC
  `).all();
  return c.json({ companies: results || [] });
});

// PATCH /api/admin/companies/:id/verify - Toggle is_verified
admin.patch('/companies/:id/verify', async (c) => {
  const companyId = c.req.param('id');
  const userId = c.get('userId');
  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first();
  if (!company) return c.json({ error: 'Company not found' }, 404);

  const newVal = (company as any).is_verified ? 0 : 1;
  await c.env.DB.prepare("UPDATE companies SET is_verified = ?, updated_at = datetime('now') WHERE id = ?").bind(newVal, companyId).run();

  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'company', ?, 'toggle_verify', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, companyId,
    JSON.stringify({ is_verified: (company as any).is_verified }),
    JSON.stringify({ is_verified: newVal })
  ).run();

  return c.json({ success: true, is_verified: newVal });
});

// PATCH /api/admin/companies/:id/status - Update company status
admin.patch('/companies/:id/status', async (c) => {
  const companyId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { status } = body;
  if (!['pending_review', 'active', 'suspended'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first();
  if (!company) return c.json({ error: 'Company not found' }, 404);

  await c.env.DB.prepare("UPDATE companies SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, companyId).run();

  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'company', ?, 'update_status', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, companyId,
    JSON.stringify({ status: (company as any).status }),
    JSON.stringify({ status })
  ).run();

  // Email company owner about status change
  try {
    const owner = await c.env.DB.prepare(
      'SELECT u.* FROM users u JOIN companies c ON c.user_id = u.id WHERE c.id = ?'
    ).bind(companyId).first<UserRow>();
    if (owner?.email) {
      const companyName = (company as any).company_name || '';
      const template = status === 'active'
        ? companyApprovedEmail(owner.full_name || 'there', companyName)
        : status === 'suspended'
        ? companySuspendedEmail(owner.full_name || 'there', companyName)
        : null;
      if (template) {
        sendEmail(c.env.RESEND_API_KEY, {
          to: owner.email,
          subject: template.subject,
          html: template.html,
        }, c.env.SANDBOX_MODE === 'true').catch(() => {});
      }
    }
  } catch { /* non-blocking */ }

  return c.json({ success: true });
});

// PATCH /api/admin/companies/:id/partner - Toggle is_partner
admin.patch('/companies/:id/partner', async (c) => {
  const companyId = c.req.param('id');
  const userId = c.get('userId');
  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first();
  if (!company) return c.json({ error: 'Company not found' }, 404);

  const newVal = (company as any).is_partner ? 0 : 1;
  await c.env.DB.prepare("UPDATE companies SET is_partner = ?, updated_at = datetime('now') WHERE id = ?").bind(newVal, companyId).run();

  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'company', ?, 'toggle_partner', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, companyId,
    JSON.stringify({ is_partner: (company as any).is_partner }),
    JSON.stringify({ is_partner: newVal })
  ).run();

  return c.json({ success: true, is_partner: newVal });
});

// GET /api/admin/jobs - List all job listings
admin.get('/jobs', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT j.*, c.company_name, c.is_partner, c.is_verified,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
    FROM job_listings j
    LEFT JOIN companies c ON j.company_id = c.id
    ORDER BY j.created_at DESC
  `).all();

  const jobs = (results || []).map((r: any) => ({
    ...r,
    requirements: JSON.parse(r.requirements || '[]'),
    benefits: JSON.parse(r.benefits || '[]'),
  }));
  return c.json({ jobs });
});

// PATCH /api/admin/jobs/:id/status - Moderate job status
admin.patch('/jobs/:id/status', async (c) => {
  const jobId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { status } = body;
  if (!['active', 'paused', 'closed'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const job = await c.env.DB.prepare('SELECT * FROM job_listings WHERE id = ?').bind(jobId).first();
  if (!job) return c.json({ error: 'Job not found' }, 404);

  await c.env.DB.prepare("UPDATE job_listings SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, jobId).run();

  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'job_listing', ?, 'update_status', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, jobId,
    JSON.stringify({ status: (job as any).status }),
    JSON.stringify({ status })
  ).run();

  return c.json({ success: true });
});

// PATCH /api/admin/jobs/:id/feature - Toggle is_featured
admin.patch('/jobs/:id/feature', async (c) => {
  const jobId = c.req.param('id');
  const userId = c.get('userId');
  const job = await c.env.DB.prepare('SELECT * FROM job_listings WHERE id = ?').bind(jobId).first();
  if (!job) return c.json({ error: 'Job not found' }, 404);

  const newVal = (job as any).is_featured ? 0 : 1;
  await c.env.DB.prepare("UPDATE job_listings SET is_featured = ?, updated_at = datetime('now') WHERE id = ?").bind(newVal, jobId).run();

  await c.env.DB.prepare(`
    INSERT INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
    VALUES (?, ?, 'job_listing', ?, 'toggle_featured', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, jobId,
    JSON.stringify({ is_featured: (job as any).is_featured }),
    JSON.stringify({ is_featured: newVal })
  ).run();

  return c.json({ success: true, is_featured: newVal });
});

// GET /api/admin/job-applications - List all applications (admin overview)
admin.get('/job-applications', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, u.email as applicant_email, u.full_name as applicant_name,
           j.title as job_title, c.company_name
    FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 500
  `).all();
  return c.json({ applications: results || [] });
});

// PATCH /api/admin/job-applications/:id/status - Update application status
admin.patch('/job-applications/:id/status', async (c) => {
  const appId = c.req.param('id');
  const { status } = await c.req.json<{ status: string }>();
  const validStatuses = ['submitted', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'];
  if (!validStatuses.includes(status)) {
    return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT * FROM job_applications WHERE id = ?').bind(appId).first();
  if (!existing) return c.json({ error: 'Application not found' }, 404);

  await c.env.DB.prepare(
    "UPDATE job_applications SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, appId).run();

  return c.json({ success: true, status });
});

// GET /api/admin/job-applications/:id/resume - Get signed URL for applicant resume
admin.get('/job-applications/:id/resume', async (c) => {
  const appId = c.req.param('id');
  const app = await c.env.DB.prepare(`
    SELECT a.*, u.email as applicant_email, u.full_name as applicant_name,
           j.title as job_title, c.company_name, r.file_name, r.storage_key
    FROM job_applications a
    JOIN job_listings j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE a.id = ?
  `).bind(appId).first<any>(appId);

  if (!app) return c.json({ error: 'Application not found' }, 404);
  if (!app.resume_id || !app.storage_key) return c.json({ error: 'No resume attached to this application' }, 404);

  try {
    const signedUrl = await c.env.R2_BUCKET.put(app.storage_key, null as any, {
      httpMetadata: { contentDisposition: `attachment; filename="${app.file_name}"` },
      redirect: 'manual',
    });
    // R2 doesn't have built-in signed URLs — return direct R2 URL pattern
    const resumeUrl = `https://pub-xxx.r2.dev/${app.storage_key}`;
    return c.json({ resumeUrl, fileName: app.file_name });
  } catch {
    return c.json({ error: 'Failed to generate resume URL' }, 500);
  }
});

// DELETE /api/admin/companies/:id - Delete a company and its jobs
admin.delete('/companies/:id', async (c) => {
  const companyId = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first();
  if (!existing) return c.json({ error: 'Company not found' }, 404);

  // Delete associated jobs first (foreign key constraint)
  await c.env.DB.prepare('DELETE FROM job_listings WHERE company_id = ?').bind(companyId).run();
  await c.env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(companyId).run();

  return c.json({ success: true, message: 'Company and associated jobs deleted' });
});

// PATCH /api/admin/users/:id/disable - Disable a user account
admin.patch('/users/:userId/disable', async (c) => {
  const userId = c.req.param('userId');
  const { disabled } = await c.req.json<{ disabled: boolean }>();

  const existing = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!existing) return c.json({ error: 'User not found' }, 404);

  await c.env.DB.prepare('UPDATE users SET disabled = ? WHERE id = ?').bind(disabled ? 1 : 0, userId).run();
  return c.json({ success: true, disabled });
});

// DELETE /api/admin/users/:id - Delete a user
admin.delete('/users/:userId', async (c) => {
  const userId = c.req.param('userId');

  const existing = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!existing) return c.json({ error: 'User not found' }, 404);

  // Prevent deleting admin users
  const role = await c.env.DB.prepare("SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'").bind(userId).first();
  if (role) return c.json({ error: 'Cannot delete admin users. Revoke admin role first.' }, 400);

  // Delete related data
  await c.env.DB.prepare('DELETE FROM job_applications WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM resumes WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  return c.json({ success: true, message: 'User deleted' });
});

export default admin;
