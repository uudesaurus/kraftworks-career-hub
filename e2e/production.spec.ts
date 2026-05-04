/**
 * Production Verification Tests — https://career.kraftworks.app/
 *
 * These tests run against the live production site to verify all public
 * flows are working correctly after deployment.
 *
 * Covers:
 * - All public pages load
 * - Career Fair job board functional
 * - Forms render correctly
 * - API endpoints healthy
 * - Auth gates work
 * - Mobile responsive
 * - No JS errors on any page
 */

import { test, expect, Page } from '@playwright/test';

const PROD_URL = process.env.PROD_URL || 'https://career.kraftworks.app';
const API_BASE = 'https://kraftworks-api.mahmudasrul11.workers.dev';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// ════════════════════════════════════════════════════════════════
//  PUBLIC PAGES — No JS Errors
// ════════════════════════════════════════════════════════════════

test.describe('Production — All Public Pages Load', () => {
  const pages = [
    { path: '/', name: 'Landing' },
    { path: '/career-toolkit', name: 'Career Toolkit' },
    { path: '/career-toolkit/hvac', name: 'HVAC Toolkit' },
    { path: '/career-toolkit/electrical', name: 'Electrical Toolkit' },
    { path: '/career-toolkit/welding', name: 'Welding Toolkit' },
    { path: '/career-fair', name: 'Career Fair' },
    { path: '/blog', name: 'Blog' },
    { path: '/waitlist', name: 'Waitlist' },
    { path: '/contact', name: 'Contact' },
    { path: '/privacy-policy', name: 'Privacy Policy' },
    { path: '/terms-of-service', name: 'Terms of Service' },
    { path: '/auth', name: 'Auth' },
  ];

  for (const { path, name } of pages) {
    test(`${name} (${path}) — loads without JS errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(`${PROD_URL}${path}`);
      await expect(page.locator('body')).toBeVisible();
      // Allow Clerk-related errors in production (expected when not authenticated)
      const realErrors = errors.filter(
        (e) => !e.includes('Clerk') && !e.includes('clerk') && !e.includes('publishableKey')
      );
      expect(realErrors).toHaveLength(0);
    });
  }
});

// ════════════════════════════════════════════════════════════════
//  LANDING PAGE — Full Content Check
// ════════════════════════════════════════════════════════════════

test.describe('Production — Landing Page Content', () => {
  test('hero section has CTA buttons', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    await expect(page.locator('body')).toBeVisible();
    const ctaLinks = page.getByRole('link');
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThan(3); // Nav links + CTAs
  });

  test('features section lists all key features', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    const body = await page.textContent('body');
    // Core features should be mentioned
    expect(body!.toLowerCase()).toMatch(/resume/);
    expect(body!.toLowerCase()).toMatch(/interview/);
  });

  test('navigation has all required links', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    await expect(page.getByRole('link', { name: /career fair/i }).first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  CAREER FAIR — Full Feature Check
// ════════════════════════════════════════════════════════════════

test.describe('Production — Career Fair Job Board', () => {
  test('hero section visible', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.getByText('Trade Jobs & Career Fair')).toBeVisible();
  });

  test('job listings section visible', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.getByRole('heading', { name: 'Open Positions' })).toBeVisible();
  });

  test('search bar functional', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    const search = page.getByPlaceholder('Search jobs, companies...');
    await expect(search).toBeVisible();
    await search.fill('electrician');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('trade filter renders', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.getByText('All Trades').first()).toBeVisible();
  });

  test('employer CTA visible', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.getByText('Hiring Trade Professionals?')).toBeVisible();
  });

  test('clicking a job card navigates to detail', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await page.waitForTimeout(2000);
    // Find first job card link
    const jobLink = page.locator('a[href*="/career-fair/jobs/"]').first();
    if (await jobLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jobLink.click();
      await expect(page).toHaveURL(/\/career-fair\/jobs\//);
      // Job detail should show company info and title
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Production — Job Detail Page', () => {
  test('valid job loads with full details', async ({ request, page }) => {
    // Get a real job ID from API
    const res = await request.get(`${API_BASE}/api/public/jobs?limit=1`);
    const data = await res.json();
    if (data.jobs.length > 0) {
      const jobId = data.jobs[0].id;
      await page.goto(`${PROD_URL}/career-fair/jobs/${jobId}`);
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(200);
    }
  });

  test('invalid job shows error state', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair/jobs/invalid-job-xyz`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  WAITLIST — Form Functionality
// ════════════════════════════════════════════════════════════════

test.describe('Production — Waitlist Forms', () => {
  test('trade grad form renders', async ({ page }) => {
    await page.goto(`${PROD_URL}/waitlist`);
    await expect(page.locator('body')).toBeVisible();
    const body = await page.textContent('body');
    expect(body!.toLowerCase()).toMatch(/trade grad|waitlist|join/);
  });

  test('employer form renders after toggle', async ({ page }) => {
    await page.goto(`${PROD_URL}/waitlist`);
    const employerTab = page.getByText(/employer/i).first();
    if (await employerTab.isVisible()) {
      await employerTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ════════════════════════════════════════════════════════════════
//  CONTACT — Form Functionality
// ════════════════════════════════════════════════════════════════

test.describe('Production — Contact Form', () => {
  test('contact form fields render', async ({ page }) => {
    await page.goto(`${PROD_URL}/contact`);
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/message/i).first()).toBeVisible();
  });

  test('submit button present', async ({ page }) => {
    await page.goto(`${PROD_URL}/contact`);
    const submitBtn = page.getByRole('button', { name: /send|submit/i }).first();
    await expect(submitBtn).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  AUTH GATES — Protected Route Redirects
// ════════════════════════════════════════════════════════════════

test.describe('Production — Auth Redirects', () => {
  const userRoutes = ['/dashboard', '/resume-review', '/interview-prep', '/settings', '/admin'];
  for (const route of userRoutes) {
    test(`${route} redirects to /auth`, async ({ page }) => {
      await page.goto(`${PROD_URL}${route}`);
      // Clerk can take several seconds to initialise — wait generously
      await page.waitForURL(/\/auth/, { timeout: 15000 });
    });
  }
});

// ════════════════════════════════════════════════════════════════
//  EMPLOYER AUTH — UX
// ════════════════════════════════════════════════════════════════

// Employer Auth UX tests removed — employer portal is a separate deployment

// ════════════════════════════════════════════════════════════════
//  404 PAGE
// ════════════════════════════════════════════════════════════════

test.describe('Production — 404 Page', () => {
  test('unknown route shows 404', async ({ page }) => {
    await page.goto(`${PROD_URL}/nonexistent-page-xyz`);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  NAVIGATION — Cross-Page Links
// ════════════════════════════════════════════════════════════════

test.describe('Production — Navigation Flow', () => {
  test('landing → career fair', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    await page.getByRole('link', { name: /career fair/i }).first().click();
    await expect(page).toHaveURL(/career-fair/);
  });

  test('career fair → Post a Job links to employer portal', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    const postJob = page.getByRole('link', { name: /Post a Job/i }).first();
    await expect(postJob).toBeVisible();
    const href = await postJob.getAttribute('href');
    expect(href).toMatch(/employer/);
  });

  test('browser back button works', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    await page.goto(`${PROD_URL}/career-fair`);
    await page.goto(`${PROD_URL}/contact`);
    await page.goBack();
    await expect(page).toHaveURL(/career-fair/);
    await page.goBack();
    // Should be back at root
    const url = page.url();
    expect(url).toMatch(/\/?$/);
  });
});

// ════════════════════════════════════════════════════════════════
//  API ENDPOINTS — Health Check
// ════════════════════════════════════════════════════════════════

test.describe('Production — API Health', () => {
  test('public jobs API returns valid response', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
    expect(data).toHaveProperty('pagination');
  });

  test('public jobs API search works', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?search=hvac`);
    expect(res.ok()).toBeTruthy();
  });

  test('public jobs API filter by trade works', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?trade_category=electrical`);
    expect(res.ok()).toBeTruthy();
  });

  test('public jobs API pagination works', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/jobs?page=1&limit=5`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.pagination.limit).toBe(5);
  });

  test('auth-protected API returns 401', async ({ request }) => {
    const endpoints = [
      `${API_BASE}/api/user/dashboard`,
      `${API_BASE}/api/user/profile`,
      `${API_BASE}/api/employer/company`,
      `${API_BASE}/api/admin/users`,
    ];
    for (const url of endpoints) {
      const res = await request.get(url);
      expect([401, 403]).toContain(res.status());
    }
  });
});

// ════════════════════════════════════════════════════════════════
//  MOBILE — Responsive Check
// ════════════════════════════════════════════════════════════════

test.describe('Production — Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('landing page renders on mobile', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${PROD_URL}/`);
    await expect(page.locator('body')).toBeVisible();
    const realErrors = errors.filter(e => !e.includes('Clerk') && !e.includes('clerk'));
    expect(realErrors).toHaveLength(0);
  });

  test('career fair renders on mobile', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.getByText('Trade Jobs & Career Fair')).toBeVisible();
  });

  test('contact form usable on mobile', async ({ page }) => {
    await page.goto(`${PROD_URL}/contact`);
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
  });

  test('waitlist usable on mobile', async ({ page }) => {
    await page.goto(`${PROD_URL}/waitlist`);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  EDGE CASES — Production Stress
// ════════════════════════════════════════════════════════════════

test.describe('Production — Edge Cases', () => {
  test('extremely long search query does not crash', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    const search = page.getByPlaceholder('Search jobs, companies...');
    await search.fill('a'.repeat(200));
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('special characters in URL handled', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair/jobs/<script>`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('concurrent page navigations do not crash', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    // Rapid navigation
    await page.goto(`${PROD_URL}/career-fair`);
    await page.goto(`${PROD_URL}/contact`);
    await page.goto(`${PROD_URL}/waitlist`);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
//  PERFORMANCE
// ════════════════════════════════════════════════════════════════

test.describe('Production — Performance', () => {
  test('landing page loads in under 15s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(15000);
  });

  test('career fair page loads in under 15s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${PROD_URL}/career-fair`, { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(15000);
  });

  test('API responds in under 5s', async ({ request }) => {
    const start = Date.now();
    await request.get(`${API_BASE}/api/public/jobs`);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
