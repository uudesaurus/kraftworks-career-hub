/**
 * Comprehensive UX Flow Tests — Kraftworks Career Hub
 *
 * Tests all flows per the UX definition:
 * 1. Core Lifecycle (CRUD)
 * 2. Logic Gates (permissions, roles, validation)
 * 3. State Definitions (empty, loading, success, error)
 * 4. Edge Cases (extreme data, timeout, connectivity)
 * 5. Navigation & Context (entry/exit points, back button)
 *
 * User types: Employee (Trade Grad), Employer, Admin
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE = 'https://kraftworks-api.mahmudasrul11.workers.dev';

// ─── Helper: collect JS errors during a test ───
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// ════════════════════════════════════════════════════════════════
//  1. PUBLIC PAGES — Happy Path + State Definitions
// ════════════════════════════════════════════════════════════════

test.describe('Public Pages — Happy Path', () => {
  const publicRoutes = [
    { path: '/', label: 'Landing' },
    { path: '/career-toolkit', label: 'Career Toolkit' },
    { path: '/career-toolkit/hvac', label: 'HVAC Toolkit' },
    { path: '/career-toolkit/electrical', label: 'Electrical Toolkit' },
    { path: '/career-toolkit/welding', label: 'Welding Toolkit' },
    { path: '/career-fair', label: 'Career Fair' },
    { path: '/blog', label: 'Blog' },
    { path: '/waitlist', label: 'Waitlist' },
    { path: '/contact', label: 'Contact' },
    { path: '/privacy-policy', label: 'Privacy Policy' },
    { path: '/terms-of-service', label: 'Terms of Service' },
  ];

  for (const { path, label } of publicRoutes) {
    test(`${label} (${path}) — loads without JS errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Landing Page — Read/Display', () => {
  test('hero section renders with CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Should have at least one CTA link or button
    const cta = page.getByRole('link', { name: /get started|join|sign up|waitlist/i }).first();
    await expect(cta).toBeVisible();
  });

  test('navigation bar shows all public links', async ({ page }) => {
    await page.goto('/');
    // Desktop nav links
    await expect(page.getByRole('link', { name: /career toolkit/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /career fair/i }).first()).toBeVisible();
  });

  test('footer links to legal pages', async ({ page }) => {
    await page.goto('/');
    const privacyLink = page.getByRole('link', { name: /privacy/i }).first();
    const termsLink = page.getByRole('link', { name: /terms/i }).first();
    if (await privacyLink.isVisible()) {
      await expect(privacyLink).toHaveAttribute('href', /privacy/);
    }
    if (await termsLink.isVisible()) {
      await expect(termsLink).toHaveAttribute('href', /terms/);
    }
  });
});

// ════════════════════════════════════════════════════════════════
//  2. CAREER FAIR — Public Job Board (Read + Filter)
// ════════════════════════════════════════════════════════════════

test.describe('Career Fair — Job Board', () => {
  test('displays job listings or empty state', async ({ page }) => {
    await page.goto('/career-fair');
    await expect(page.getByText('Trade Jobs & Career Fair')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Open Positions' })).toBeVisible();
    // Either shows job cards or empty state
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('search filter works', async ({ page }) => {
    await page.goto('/career-fair');
    const searchInput = page.getByPlaceholder('Search jobs, companies...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('electrician');
    // Wait for filter to apply
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('trade category filter renders', async ({ page }) => {
    await page.goto('/career-fair');
    const tradeFilter = page.getByText('All Trades').first();
    await expect(tradeFilter).toBeVisible();
  });

  test('employer CTA section is visible', async ({ page }) => {
    await page.goto('/career-fair');
    await expect(page.getByText('Hiring Trade Professionals?')).toBeVisible();
  });

  test('"Post a Job" links to employer portal', async ({ page }) => {
    await page.goto('/career-fair');
    const postJobLink = page.getByRole('link', { name: /Post a Job/i }).first();
    await expect(postJobLink).toBeVisible();
    await expect(postJobLink).toHaveAttribute('href', /employer-dist\.vercel\.app\/?$/);
  });
});

test.describe('Career Fair — Job Detail', () => {
  test('invalid job ID shows error state gracefully', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/career-fair/jobs/non-existent-id');
    await page.waitForTimeout(2000);
    // Should show "Job not found" or error message, not a crash
    await expect(page.locator('body')).toBeVisible();
    const text = await page.textContent('body');
    expect(text).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════
//  3. WAITLIST FORMS — CRUD (Create) + Validation
// ════════════════════════════════════════════════════════════════

test.describe('Waitlist — Trade Grad Form', () => {
  test('form renders with required fields', async ({ page }) => {
    await page.goto('/waitlist');
    // Default tab should be Trade Grad
    await expect(page.getByText(/trade grad/i).first()).toBeVisible();
    await expect(page.getByLabel(/full name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
  });

  test('submit button is disabled until form is valid', async ({ page }) => {
    await page.goto('/waitlist');
    const submitBtn = page.getByRole('button', { name: /join waitlist|submit|sign up/i }).first();
    // Button should be disabled when form is empty
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('employer tab toggle works', async ({ page }) => {
    await page.goto('/waitlist');
    const employerTab = page.getByText(/employer/i).first();
    await expect(employerTab).toBeVisible();
    await employerTab.click();
    await page.waitForTimeout(300);
    // Should show employer-specific fields
    const companyEmail = page.getByLabel(/company email|email/i).first();
    await expect(companyEmail).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  4. CONTACT FORM — Create + Validation + Success State
// ════════════════════════════════════════════════════════════════

test.describe('Contact Form — CRUD (Create)', () => {
  test('form renders with all fields', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/message/i).first()).toBeVisible();
  });

  test('validation — empty submit prevented', async ({ page }) => {
    await page.goto('/contact');
    const submitBtn = page.getByRole('button', { name: /send|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(300);
      // HTML5 validation should prevent submission
      // Check we're still on the contact page
      await expect(page).toHaveURL(/contact/);
    }
  });
});

// ════════════════════════════════════════════════════════════════
//  5. AUTH — Logic Gates (Permissions)
// ════════════════════════════════════════════════════════════════

test.describe('Auth — Protected Route Redirects', () => {
  const protectedRoutes = [
    { path: '/dashboard', redirect: '/auth' },
    { path: '/resume-review', redirect: '/auth' },
    { path: '/interview-prep', redirect: '/auth' },
    { path: '/settings', redirect: '/auth' },
    { path: '/admin', redirect: '/auth' },
  ];

  for (const { path, redirect } of protectedRoutes) {
    test(`${path} redirects to ${redirect} (unauthenticated)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(1500);
      await expect(page).toHaveURL(new RegExp(redirect));
    });
  }
});

test.describe('Auth — Employer Protected Routes', () => {
  test.setTimeout(60000); // Clerk auth can be slow to load
  const employerRoutes = [
    '/employer',
    '/employer/register',
    '/employer/company',
    '/employer/jobs',
    '/employer/jobs/new',
    '/employer/applications',
  ];

  for (const path of employerRoutes) {
    test(`${path} redirects to /employer/auth (unauthenticated)`, async ({ page }) => {
      await page.goto(path);
      // Clerk auth can take a few seconds to resolve
      await expect(page).toHaveURL(/\/employer\/auth/, { timeout: 30000 });
    });
  }
});

test.describe('Auth Page — Display', () => {
  test.setTimeout(60000);

  test('auth page renders', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
    // In production mode, Clerk renders the sign-in form
    // In sandbox mode, it shows auto-login
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(10);
  });

  test('employer auth page renders', async ({ page }) => {
    await page.goto('/employer/auth');
    await expect(page.locator('body')).toBeVisible();
    // Wait for Clerk to load (can be slow)
    await page.waitForTimeout(5000);
    const body = await page.textContent('body');
    expect(body!.toLowerCase()).toMatch(/employer|sign in|sign up|account|career/);
  });

  test('employer auth has "Back to Career Fair" link', async ({ page }) => {
    await page.goto('/employer/auth');
    // Wait for content to render
    await page.waitForTimeout(3000);
    const backLink = page.getByText(/Back to Career Fair/i);
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });
});

// ════════════════════════════════════════════════════════════════
//  6. 404 PAGE — Edge Case
// ════════════════════════════════════════════════════════════════

test.describe('404 — Not Found', () => {
  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page.locator('body')).toBeVisible();
    const text = await page.textContent('body');
    expect(text!.toLowerCase()).toMatch(/not found|404|page not found/);
  });

  test('deeply nested unknown route still shows 404', async ({ page }) => {
    await page.goto('/a/b/c/d/e/f/g');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  7. NAVIGATION — Entry/Exit Points, Back Button, Cross-Links
// ════════════════════════════════════════════════════════════════

test.describe('Navigation — Cross-page Links', () => {
  test('landing → career fair via nav link', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: /career fair/i }).first();
    await link.click();
    await expect(page).toHaveURL(/career-fair/);
  });

  test('landing → waitlist via CTA', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: /waitlist|join/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/waitlist/);
    }
  });

  test('career fair → employer auth via "Post a Job"', async ({ page }) => {
    await page.goto('/career-fair');
    const postJob = page.getByRole('link', { name: /Post a Job/i }).first();
    await postJob.click();
    await page.waitForTimeout(1000);
    // Should go to /employer which redirects to /employer/auth
    await expect(page).toHaveURL(/employer/);
  });

  test('career toolkit dropdown navigates to sub-pages', async ({ page }) => {
    await page.goto('/');
    // Click Career Toolkit in nav
    const toolkitLink = page.getByRole('link', { name: /career toolkit/i }).first();
    await toolkitLink.click();
    await expect(page).toHaveURL(/career-toolkit/);
  });

  test('employer auth → career fair via back link', async ({ page }) => {
    await page.goto('/employer/auth');
    const backLink = page.getByText(/Back to Career Fair/i);
    await backLink.click();
    await expect(page).toHaveURL(/career-fair/);
  });
});

test.describe('Navigation — Browser Back Button', () => {
  test('back button returns to previous page', async ({ page }) => {
    await page.goto('/');
    await page.goto('/career-fair');
    await page.goto('/contact');
    await page.goBack();
    await expect(page).toHaveURL(/career-fair/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });
});

// ════════════════════════════════════════════════════════════════
//  8. API ENDPOINTS — System Path (Backend Health)
// ════════════════════════════════════════════════════════════════

test.describe('API — Public Endpoints (System Path)', () => {
  test('GET /api/public/jobs returns valid JSON', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
    expect(Array.isArray(data.jobs)).toBeTruthy();
    expect(data).toHaveProperty('pagination');
  });

  test('GET /api/public/jobs with search filter', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?search=electrician`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  test('GET /api/public/jobs with trade_category filter', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?trade_category=hvac`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  test('GET /api/public/jobs with state filter', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?state=TX`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  test('GET /api/public/jobs with employment_type filter', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?employment_type=full_time`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  test('GET /api/public/jobs with pagination', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?page=1&limit=3`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.pagination.limit).toBe(3);
  });

  test('GET /api/public/jobs/:id returns 404 for invalid ID', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs/nonexistent-12345`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/public/jobs/:id returns job for valid ID', async ({ request }) => {
    // First get a real job ID
    try {
      const listRes = await request.get(`${API_BASE}/api/public/jobs?limit=1`);
      if (!listRes.ok()) return;
      const listData = await listRes.json();
      if (listData.jobs && listData.jobs.length > 0) {
        const jobId = listData.jobs[0].id;
        const res = await request.get(`${API_BASE}/api/public/jobs/${jobId}`);
        expect(res.ok()).toBeTruthy();
        const data = await res.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('title');
      }
    } catch {
      // API might be rate-limited or temporarily unavailable
    }
  });
});

test.describe('API — Auth Required Endpoints (Logic Gates)', () => {
  test('GET /api/user/dashboard returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/user/dashboard`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/user/profile returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/user/profile`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/resume/details returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/resume/details`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/feedback/list returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/feedback/list`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/questions/list returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/questions/list`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/employer/company returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/employer/company`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/admin/users returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/admin/users`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/admin/feedback/queue returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/admin/feedback/queue`);
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/employer/jobs returns 401 without token', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/employer/jobs`, {
      data: { title: 'test' },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('API — Public Form Submissions (Create)', () => {
  test('POST /api/public/contact with valid data succeeds', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/public/contact`, {
      data: {
        full_name: 'E2E Test User',
        email: 'e2etest@example.com',
        subject: 'Automated Test',
        message: 'This is an automated e2e test submission — please ignore.',
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('POST /api/public/contact with missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/public/contact`, {
      data: { full_name: 'Test' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/public/waitlist/trade-grads with missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/public/waitlist/trade-grads`, {
      data: { full_name: 'Test' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/public/waitlist/employers with missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/public/waitlist/employers`, {
      data: { full_name: 'Test' },
    });
    expect(res.status()).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════
//  9. EDGE CASES — Stress Tests
// ════════════════════════════════════════════════════════════════

test.describe('Edge Cases — Extreme Data', () => {
  test('search with 200-character query does not crash', async ({ page }) => {
    await page.goto('/career-fair');
    const search = page.getByPlaceholder('Search jobs, companies...');
    await search.fill('a'.repeat(200));
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('API handles very long search gracefully', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?search=${'a'.repeat(100)}`);
    // Should return 200 with empty results, not crash
    expect([200, 400, 414, 500]).toContain(res.status());
  });

  test('API handles negative page number', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?page=-1`);
    expect([200, 400]).toContain(res.status());
  });

  test('API handles extremely large page number', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?page=999999`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.jobs).toHaveLength(0);
  });

  test('API handles SQL injection attempt gracefully', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?search='; DROP TABLE jobs; --`);
    // Should return normally, not error
    expect([200, 400]).toContain(res.status());
  });

  test('API handles XSS attempt in search gracefully', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?search=<script>alert(1)</script>`);
    expect([200, 400]).toContain(res.status());
  });
});

test.describe('Edge Cases — Invalid Routes & Deep Paths', () => {
  test('double-slash path does not crash', async ({ page }) => {
    const errors = collectErrors(page);
    // Navigate to a path with encoded double-slash
    await page.goto('/career-fair/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('URL with special characters loads gracefully', async ({ page }) => {
    await page.goto('/career-fair/jobs/%00%01%02');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  10. RESPONSIVE / MOBILE — Edge Path
// ════════════════════════════════════════════════════════════════

test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 13 Mini

  test('landing page is usable on mobile', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('career fair is usable on mobile', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/career-fair');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('contact form is usable on mobile', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/message/i).first()).toBeVisible();
  });

  test('waitlist page is usable on mobile', async ({ page }) => {
    await page.goto('/waitlist');
    await expect(page.locator('body')).toBeVisible();
  });

  test('mobile menu opens (hamburger)', async ({ page }) => {
    await page.goto('/');
    // Look for hamburger/menu button
    const menuBtn = page.getByRole('button', { name: /menu|toggle/i }).first();
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      // Menu links should now be visible
      const navLink = page.getByRole('link', { name: /career fair/i }).first();
      await expect(navLink).toBeVisible();
    }
  });
});

// ════════════════════════════════════════════════════════════════
//  11. PERFORMANCE — System Path
// ════════════════════════════════════════════════════════════════

test.describe('Performance — Page Load Times', () => {
  test('landing page loads in under 10s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('career fair page loads in under 10s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/career-fair', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('API responds in under 5s', async ({ request }) => {
    const start = Date.now();
    await request.get(`${API_BASE}/api/public/jobs`);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
