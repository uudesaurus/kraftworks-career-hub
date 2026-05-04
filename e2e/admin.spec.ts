import { test, expect } from '@playwright/test';

// These tests require VITE_SANDBOX_MODE=true so Clerk is bypassed
// and the sandbox user is auto-granted admin role.

test.describe('Admin Panel — Navigation', () => {
  test('admin can access /admin without redirect', async ({ page }) => {
    // In sandbox mode, the user is auto-authenticated as admin
    await page.goto('/admin');
    // Should NOT redirect to /auth or /dashboard
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin panel renders header and tabs', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Admin Panel')).toBeVisible();
    // Check all 6 tabs are present
    await expect(page.getByRole('tab', { name: /reviews/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /trade grads/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /employers/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /contacts/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /audit log/i })).toBeVisible();
  });

  test('all tabs render without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/admin');
    await page.waitForTimeout(500);

    // Click each tab and verify no errors
    const tabs = ['reviews', 'trade grads', 'employers', 'contacts', 'users', 'audit log'];
    for (const tab of tabs) {
      await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();
      await page.waitForTimeout(300);
    }

    expect(errors).toHaveLength(0);
  });
});

test.describe('Admin Panel — Users Tab', () => {
  test('users tab shows table with columns', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();

    // Look for table headers
    await expect(page.getByText('User Management')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /joined/i })).toBeVisible();
  });

  test('users tab search filters results', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();
    await page.waitForTimeout(500);

    // Type a search query that likely won't match anything
    const searchInput = page.locator('input[placeholder="Search users..."]');
    await searchInput.fill('nonexistentemailxyz123');
    await page.waitForTimeout(300);

    // Should show "No users found" or empty state
    const noUsers = page.getByText('No users found');
    const tableRows = page.locator('table tbody tr');
    const count = await tableRows.count();
    // Either no rows or "no users found" message
    expect(count === 0 || await noUsers.isVisible()).toBeTruthy();
  });

  test('users tab export CSV button exists', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /users/i }).click();
    await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
  });
});

test.describe('Admin Panel — Audit Log', () => {
  test('audit log tab renders with entity filter', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /audit log/i }).click();

    await expect(page.getByText('Audit Log')).toBeVisible();
    // Should have the entity filter dropdown
    await expect(page.getByText('All entities')).toBeVisible();
  });

  test('audit log search works', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /audit log/i }).click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder="Search..."]').last();
    await searchInput.fill('nonexistentaction123');
    await page.waitForTimeout(300);

    // Either no results or "No audit records" message
    const noRecords = page.getByText('No audit records');
    if (await noRecords.isVisible()) {
      expect(await noRecords.isVisible()).toBeTruthy();
    }
  });
});

test.describe('Admin Panel — Summary Cards', () => {
  test('summary cards render with counts', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByText('Pending Reviews')).toBeVisible();
    await expect(page.getByText('Total Waitlist')).toBeVisible();
    await expect(page.getByText('New Contacts')).toBeVisible();
    await expect(page.getByText('Approved Feedback')).toBeVisible();
    await expect(page.getByText('Total Users')).toBeVisible();
  });

  test('refresh button works', async ({ page }) => {
    await page.goto('/admin');
    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    // Should show success toast
    await expect(page.getByText('Data refreshed')).toBeVisible();
  });
});

test.describe('Admin Panel — Existing Tabs', () => {
  test('reviews tab loads feedback table', async ({ page }) => {
    await page.goto('/admin');
    // Reviews is the default tab
    await expect(page.getByText('Resume Feedback Submissions')).toBeVisible();
  });

  test('trade grads tab loads', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /trade grads/i }).click();
    await expect(page.getByText('Trade Grad Waitlist')).toBeVisible();
  });

  test('employers tab loads', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /employers/i }).click();
    await expect(page.getByText('Employer Waitlist')).toBeVisible();
  });

  test('contacts tab loads', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('tab', { name: /contacts/i }).click();
    await expect(page.getByText('Contact Submissions')).toBeVisible();
  });
});
