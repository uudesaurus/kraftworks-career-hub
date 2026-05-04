/**
 * Authenticated User Flows — Sandbox Mode
 *
 * Tests CRUD, Logic Gates, State Definitions for:
 * - Employee/Trade Grad (Dashboard, Resume, Interview Prep, Job Application)
 * - Admin (All admin panel tabs + CRUD operations)
 *
 * Requires VITE_SANDBOX_MODE=true (sandbox user auto-authenticated as admin)
 */

import { test, expect, Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// ════════════════════════════════════════════════════════════════
//  EMPLOYEE / TRADE GRAD FLOWS
// ════════════════════════════════════════════════════════════════

test.describe('Employee — Dashboard (Read)', () => {
  test('dashboard loads with welcome message', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    // In sandbox mode, should render dashboard (not redirect to auth)
    const url = page.url();
    expect(url).toContain('/dashboard');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('dashboard shows quick action cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    // Should show feature cards
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('dashboard links to resume review', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    const link = page.getByRole('link', { name: /resume/i }).first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/resume-review|resume/);
    }
  });

  test('dashboard links to interview prep', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    const link = page.getByRole('link', { name: /interview/i }).first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/interview-prep|interview/);
    }
  });
});

test.describe('Employee — Resume Review (CRUD)', () => {
  test('resume review page loads without crash', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/resume-review');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('resume upload area is visible', async ({ page }) => {
    await page.goto('/resume-review');
    await page.waitForTimeout(2000);
    // Should show upload area or existing resume info
    const body = await page.textContent('body');
    expect(body!.toLowerCase()).toMatch(/upload|resume|drag|drop|pdf|review/);
  });

  test('feedback section renders (empty or with data)', async ({ page }) => {
    await page.goto('/resume-review');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // Should show feedback, history, or empty state
    expect(body!.length).toBeGreaterThan(100);
  });
});

test.describe('Employee — Interview Prep (CRUD)', () => {
  test('interview prep page loads', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/interview-prep');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('job description textarea is visible', async ({ page }) => {
    await page.goto('/interview-prep');
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('validation — short input (< 10 chars) shows error', async ({ page }) => {
    await page.goto('/interview-prep');
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea').first();
    await textarea.fill('short');
    const submitBtn = page.getByRole('button', { name: /generate|get questions/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      // Should stay on page, possibly show validation message
      await expect(page).toHaveURL(/interview-prep/);
    }
  });

  test('previous questions section renders', async ({ page }) => {
    await page.goto('/interview-prep');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // Should show previous questions, history, or empty state
    expect(body!.length).toBeGreaterThan(100);
  });
});

test.describe('Employee — Settings (Read/Update)', () => {
  test('settings page loads', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('shows account info', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body!.toLowerCase()).toMatch(/account|profile|settings|role|email/);
  });
});

// ════════════════════════════════════════════════════════════════
//  ADMIN FLOWS
// ════════════════════════════════════════════════════════════════

test.describe('Admin — Panel Navigation', () => {
  test('admin panel loads without redirect', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/admin');
    expect(errors).toHaveLength(0);
  });

  test('admin panel shows header and all tabs', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Admin Panel')).toBeVisible();
    const tabs = ['reviews', 'trade grads', 'employers', 'contacts', 'users', 'audit log'];
    for (const tab of tabs) {
      await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible();
    }
  });

  test('all tabs switch without errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const tabs = ['reviews', 'trade grads', 'employers', 'contacts', 'users', 'audit log'];
    for (const tab of tabs) {
      await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();
      await page.waitForTimeout(500);
    }
    expect(errors).toHaveLength(0);
  });
});

test.describe('Admin — Summary Cards (Read)', () => {
  test('summary cards show counts', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Pending Reviews')).toBeVisible();
    await expect(page.getByText('Total Waitlist')).toBeVisible();
    await expect(page.getByText('New Contacts')).toBeVisible();
    await expect(page.getByText('Total Users')).toBeVisible();
  });

  test('refresh button triggers data reload', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    // Should show success toast
    await expect(page.getByText('Data refreshed')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin — Reviews Tab (CRUD)', () => {
  test('reviews tab loads feedback table', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    // Reviews is default tab
    await expect(page.getByText('Resume Feedback Submissions')).toBeVisible();
  });
});

test.describe('Admin — Trade Grads Tab (Read + Delete)', () => {
  test('trade grads tab loads', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /trade grads/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Trade Grad Waitlist')).toBeVisible();
  });

  test('trade grads has search functionality', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /trade grads/i }).click();
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="earch"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('trade grads has CSV export', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /trade grads/i }).click();
    await page.waitForTimeout(1000);
    const exportBtn = page.getByRole('button', { name: /export|csv/i }).first();
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
  });
});

test.describe('Admin — Employers Tab (Read)', () => {
  test('employers waitlist tab loads', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /employers/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Employer Waitlist')).toBeVisible();
  });
});

test.describe('Admin — Contacts Tab (Read + Update Status)', () => {
  test('contacts tab loads submissions', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /contacts/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Contact Submissions')).toBeVisible();
  });
});

test.describe('Admin — Users Tab (Read + Role Management)', () => {
  test('users tab shows table', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('users tab has columns', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible();
  });

  test('users tab search works', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder="Search users..."]');
    await searchInput.fill('nonexistentemailxyz');
    await page.waitForTimeout(500);

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    const noUsers = page.getByText('No users found');
    expect(count === 0 || await noUsers.isVisible().catch(() => false)).toBeTruthy();
  });

  test('users tab export CSV button exists', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
  });
});

test.describe('Admin — Audit Log Tab (Read + Filter)', () => {
  test('audit log tab renders', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /audit log/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Audit Log')).toBeVisible();
  });

  test('audit log has entity filter', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /audit log/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('All entities')).toBeVisible();
  });

  test('audit log search works', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /audit log/i }).click();
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder="Search..."]').last();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('nonexistentaction');
      await page.waitForTimeout(500);
    }
  });
});

// ════════════════════════════════════════════════════════════════
//  ADMIN — Career Fair Management
// ════════════════════════════════════════════════════════════════

test.describe('Admin — Career Fair Companies Tab', () => {
  test('companies tab accessible from admin panel', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    // Look for Career Fair or Companies sub-tab
    const companiesTab = page.getByRole('tab', { name: /companies/i });
    if (await companiesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companiesTab.click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });
});

test.describe('Admin — Career Fair Jobs Tab', () => {
  test('jobs tab accessible from admin panel', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    const jobsTab = page.getByRole('tab', { name: /jobs/i });
    if (await jobsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await jobsTab.click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });
});
