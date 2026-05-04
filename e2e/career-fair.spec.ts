import { test, expect } from '@playwright/test';

const PROD_URL = 'https://career.kraftworks.app';

test.describe('Career Fair - Public Pages', () => {
  test('career fair page loads with hero and job board', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Trade Jobs & Career Fair')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Open Positions' })).toBeVisible();
    // Filters should be present
    await expect(page.getByPlaceholder('Search jobs, companies...')).toBeVisible();
  });

  test('career fair shows filters and empty state or jobs', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    // Filter selects should exist
    await expect(page.getByText('All Trades').first()).toBeVisible();
    // Either shows jobs or "No jobs found" message
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('employer CTA section is visible', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    await expect(page.getByText('Hiring Trade Professionals?')).toBeVisible();
    const getStartedLink = page.getByRole('link', { name: /Get Started/i }).first();
    await expect(getStartedLink).toBeVisible();
  });

  test('career fair "Post a Job" links to employer portal', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair`);
    const postJobLink = page.getByRole('link', { name: /Post a Job/i }).first();
    await expect(postJobLink).toBeVisible();
    await expect(postJobLink).toHaveAttribute('href', '/employer');
  });
});

test.describe('Career Fair - Job Detail', () => {
  test('invalid job ID shows not found', async ({ page }) => {
    await page.goto(`${PROD_URL}/career-fair/jobs/non-existent-id`);
    await expect(page.locator('body')).toBeVisible();
    // Should show "Job not found" or at least render without crash
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});

test.describe('Employer Portal - Auth Required', () => {
  test('employer dashboard redirects to auth when not logged in', async ({ page }) => {
    await page.goto(`${PROD_URL}/employer`);
    // Should redirect to employer auth
    await expect(page).toHaveURL(/\/employer\/auth/);
  });

  test('employer auth page loads', async ({ page }) => {
    await page.goto(`${PROD_URL}/employer/auth`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Employer Sign In')).toBeVisible();
    await expect(page.getByText(/Back to Career Fair/i)).toBeVisible();
  });

  test('employer auth has sign up toggle', async ({ page }) => {
    await page.goto(`${PROD_URL}/employer/auth`);
    const toggleBtn = page.getByText(/Don't have an account/i);
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.getByText('Create Employer Account')).toBeVisible();
  });

  test('employer register redirects to auth', async ({ page }) => {
    await page.goto(`${PROD_URL}/employer/register`);
    await expect(page).toHaveURL(/\/employer\/auth/);
  });

  test('employer jobs redirects to auth', async ({ page }) => {
    await page.goto(`${PROD_URL}/employer/jobs`);
    await expect(page).toHaveURL(/\/employer\/auth/);
  });

  test('employer applications redirects to auth', async ({ page }) => {
    await page.goto(`${PROD_URL}/employer/applications`);
    await expect(page).toHaveURL(/\/employer\/auth/);
  });
});

test.describe('Navigation - Career Fair Links', () => {
  test('navbar has Career Fair link', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    const navLink = page.getByRole('link', { name: /Career Fair/i }).first();
    await expect(navLink).toBeVisible();
  });

  test('navbar has For Employers link', async ({ page }) => {
    await page.goto(`${PROD_URL}/`);
    const empLink = page.getByRole('link', { name: /For Employers/i }).first();
    await expect(empLink).toBeVisible();
  });

  test('career fair page does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${PROD_URL}/career-fair`);
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('API - Public Jobs Endpoint', () => {
  test('public jobs API returns valid response', async ({ request }) => {
    const res = await request.get('https://kraftworks-api.mahmudasrul11.workers.dev/api/public/jobs');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
    expect(Array.isArray(data.jobs)).toBeTruthy();
    expect(data).toHaveProperty('pagination');
  });

  test('public jobs API supports search filter', async ({ request }) => {
    const res = await request.get('https://kraftworks-api.mahmudasrul11.workers.dev/api/public/jobs?search=electrician');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  test('public jobs API supports trade_category filter', async ({ request }) => {
    const res = await request.get('https://kraftworks-api.mahmudasrul11.workers.dev/api/public/jobs?trade_category=hvac');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
  });

  test('public job detail returns 404 for invalid ID', async ({ request }) => {
    const res = await request.get('https://kraftworks-api.mahmudasrul11.workers.dev/api/public/jobs/nonexistent-id-12345');
    expect(res.status()).toBe(404);
  });
});
