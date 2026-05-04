import { Hono } from 'hono';
import type { Env, JobListingRow, CompanyRow } from '../types';

const publicJobs = new Hono<{ Bindings: Env }>();

// GET /api/public/jobs - List active jobs with filters & pagination
publicJobs.get('/', async (c) => {
  const url = new URL(c.req.url);
  const search = url.searchParams.get('search') || '';
  const tradeCategory = url.searchParams.get('trade_category') || '';
  const state = url.searchParams.get('state') || '';
  const employmentType = url.searchParams.get('employment_type') || '';
  const companyId = url.searchParams.get('company_id') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  let where = "WHERE j.status = 'active'";
  const params: any[] = [];

  if (tradeCategory) {
    where += ' AND j.trade_category = ?';
    params.push(tradeCategory);
  }
  if (state) {
    where += ' AND j.state = ?';
    params.push(state);
  }
  if (employmentType) {
    where += ' AND j.employment_type = ?';
    params.push(employmentType);
  }
  if (companyId) {
    where += ' AND j.company_id = ?';
    params.push(companyId);
  }
  if (search) {
    where += ' AND (j.title LIKE ? OR j.description LIKE ? OR c.company_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  // Count total
  const countQuery = `SELECT COUNT(*) as total FROM job_listings j LEFT JOIN companies c ON j.company_id = c.id ${where}`;
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;

  // Fetch page — featured jobs first, then newest
  const dataQuery = `
    SELECT j.*, c.company_name, c.company_logo_url, c.is_partner, c.is_verified, c.city as company_city, c.state as company_state
    FROM job_listings j
    LEFT JOIN companies c ON j.company_id = c.id
    ${where}
    ORDER BY j.is_featured DESC, j.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c.env.DB.prepare(dataQuery).bind(...params, limit, offset).all();

  const jobs = (results || []).map((r: any) => ({
    ...r,
    requirements: JSON.parse(r.requirements || '[]'),
    benefits: JSON.parse(r.benefits || '[]'),
  }));

  return c.json({
    jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/public/jobs/:id - Single job detail + company info
publicJobs.get('/:id', async (c) => {
  const jobId = c.req.param('id');

  const job = await c.env.DB.prepare(`
    SELECT j.*, c.company_name, c.company_email, c.company_phone, c.company_website,
           c.company_logo_url, c.industry, c.company_size, c.description as company_description,
           c.city as company_city, c.state as company_state, c.is_partner, c.is_verified
    FROM job_listings j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `).bind(jobId).first();

  if (!job) return c.json({ error: 'Job not found' }, 404);

  // Increment views (fire-and-forget)
  c.env.DB.prepare('UPDATE job_listings SET views_count = views_count + 1 WHERE id = ?').bind(jobId).run().catch(() => {});

  return c.json({
    job: {
      ...(job as any),
      requirements: JSON.parse((job as any).requirements || '[]'),
      benefits: JSON.parse((job as any).benefits || '[]'),
    },
  });
});

// GET /api/public/companies/:id - Public company profile
publicJobs.get('/companies/:id', async (c) => {
  const companyId = c.req.param('id');

  const company = await c.env.DB.prepare(`
    SELECT id, company_name, company_email, company_website, company_logo_url, industry,
           company_size, description, city, state, is_partner, is_verified, created_at
    FROM companies WHERE id = ? AND status = 'active'
  `).bind(companyId).first();

  if (!company) return c.json({ error: 'Company not found' }, 404);

  // Count active jobs for this company
  const jobCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM job_listings WHERE company_id = ? AND status = 'active'"
  ).bind(companyId).first<{ count: number }>();

  return c.json({ company: { ...(company as any), active_jobs: jobCount?.count || 0 } });
});

export default publicJobs;
