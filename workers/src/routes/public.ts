import { Hono } from 'hono';
import type { Env } from '../types';
import {
  sendEmail,
  tradeGradConfirmationEmail,
  employerConfirmationEmail,
  contactAcknowledgmentEmail,
  contactAdminNotificationEmail,
} from '../lib/resend';
import { getAdminEmails } from '../lib/admin-notify';

const publicRoutes = new Hono<{ Bindings: Env }>();

// POST /api/public/waitlist/trade-grads
publicRoutes.post('/waitlist/trade-grads', async (c) => {
  const body = await c.req.json<{
    full_name: string;
    email: string;
    trade_program: string;
    state: string;
    city: string;
    consent: boolean;
  }>();

  // Validate required fields
  if (!body.full_name?.trim() || !body.email?.trim() || !body.trade_program || !body.state || !body.city?.trim()) {
    return c.json({ error: 'All fields are required.' }, 400);
  }
  if (!body.consent) {
    return c.json({ error: 'Consent is required.' }, 400);
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return c.json({ error: 'Invalid email address.' }, 400);
  }

  try {
    await c.env.DB.prepare(`
      INSERT INTO trade_grad_waitlist (id, full_name, email, trade_program, state, city, consent)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      crypto.randomUUID().replace(/-/g, ''),
      body.full_name.trim(),
      body.email.trim().toLowerCase(),
      body.trade_program,
      body.state,
      body.city.trim(),
    ).run();
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'This email is already on the waitlist.' }, 409);
    }
    throw err;
  }

  // Send confirmation email (fire-and-forget)
  const emailContent = tradeGradConfirmationEmail(body.full_name.trim());
  sendEmail(c.env.RESEND_API_KEY, {
    to: body.email.trim(),
    ...emailContent,
  }, c.env.SANDBOX_MODE === 'true').catch(() => {});

  return c.json({ success: true }, 201);
});

// POST /api/public/waitlist/employers
publicRoutes.post('/waitlist/employers', async (c) => {
  const body = await c.req.json<{
    full_name: string;
    company_email: string;
    job_title?: string;
    trades_hiring_for?: string;
    hiring_volume?: string;
    state: string;
    city: string;
    consent: boolean;
  }>();

  if (!body.full_name?.trim() || !body.company_email?.trim() || !body.state || !body.city?.trim()) {
    return c.json({ error: 'Required fields: full_name, company_email, state, city.' }, 400);
  }
  if (!body.consent) {
    return c.json({ error: 'Consent is required.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.company_email.trim())) {
    return c.json({ error: 'Invalid email address.' }, 400);
  }

  try {
    await c.env.DB.prepare(`
      INSERT INTO employer_waitlist (id, full_name, company_email, job_title, trades_hiring_for, hiring_volume, state, city, consent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      crypto.randomUUID().replace(/-/g, ''),
      body.full_name.trim(),
      body.company_email.trim().toLowerCase(),
      body.job_title?.trim() || null,
      body.trades_hiring_for?.trim() || null,
      body.hiring_volume || null,
      body.state,
      body.city.trim(),
    ).run();
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'This email is already on the waitlist.' }, 409);
    }
    throw err;
  }

  // Send confirmation email (fire-and-forget)
  const emailContent = employerConfirmationEmail(body.full_name.trim());
  sendEmail(c.env.RESEND_API_KEY, {
    to: body.company_email.trim(),
    ...emailContent,
  }, c.env.SANDBOX_MODE === 'true').catch(() => {});

  return c.json({ success: true }, 201);
});

// POST /api/public/contact - Submit contact form
publicRoutes.post('/contact', async (c) => {
  const body = await c.req.json<{
    full_name: string;
    email: string;
    subject?: string;
    message: string;
  }>();

  if (!body.full_name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return c.json({ error: 'Name, email, and message are required.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return c.json({ error: 'Invalid email address.' }, 400);
  }

  await c.env.DB.prepare(`
    INSERT INTO contact_submissions (id, full_name, email, subject, message)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''),
    body.full_name.trim(),
    body.email.trim().toLowerCase(),
    body.subject?.trim() || null,
    body.message.trim(),
  ).run();

  // Send acknowledgment to user (fire-and-forget)
  const ackEmail = contactAcknowledgmentEmail(body.full_name.trim());
  sendEmail(c.env.RESEND_API_KEY, {
    to: body.email.trim(),
    ...ackEmail,
  }, c.env.SANDBOX_MODE === 'true').catch(() => {});

  // Notify all admins (fire-and-forget)
  const adminEmails = await getAdminEmails(c.env.DB, c.env.ADMIN_EMAIL);
  if (adminEmails.length > 0) {
    const adminEmailContent = contactAdminNotificationEmail(
      body.full_name.trim(),
      body.email.trim(),
      body.subject?.trim() || null,
      body.message.trim(),
    );
    for (const adminEmail of adminEmails) {
      sendEmail(c.env.RESEND_API_KEY, {
        to: adminEmail,
        ...adminEmailContent,
      }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
  }

  return c.json({ success: true }, 201);
});

// POST /api/public/newsletter/subscribe
publicRoutes.post('/newsletter/subscribe', async (c) => {
  const body = await c.req.json<{ email: string }>();

  if (!body.email?.trim()) {
    return c.json({ error: 'Email is required.' }, 400);
  }

  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Invalid email address.' }, 400);
  }

  try {
    await c.env.DB.prepare(
      'INSERT INTO newsletter_subscribers (id, email, source) VALUES (?, ?, ?)'
    ).bind(
      crypto.randomUUID().replace(/-/g, ''),
      email,
      'footer',
    ).run();
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'This email is already subscribed.' }, 409);
    }
    throw err;
  }

  return c.json({ success: true }, 201);
});

export default publicRoutes;
