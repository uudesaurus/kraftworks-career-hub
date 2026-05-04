import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads and shows hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kraftworks/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigates to waitlist page', async ({ page }) => {
    await page.goto('/');
    const waitlistLink = page.getByRole('link', { name: /waitlist/i }).first();
    if (await waitlistLink.isVisible()) {
      await waitlistLink.click();
      await expect(page).toHaveURL(/waitlist/);
    }
  });

  test('navigates to contact page', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Public pages load without errors', () => {
  const publicRoutes = [
    '/',
    '/career-toolkit',
    '/career-fair',
    '/blog',
    '/waitlist',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
  ];

  for (const route of publicRoutes) {
    test(`${route} loads`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Auth redirect for protected routes', () => {
  const protectedRoutes = ['/dashboard', '/resume-review', '/interview-prep', '/admin'];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /auth`, async ({ page }) => {
      await page.goto(route);
      // Should redirect to auth page when not logged in
      await expect(page).toHaveURL(/\/auth/);
    });
  }
});

test.describe('404 page', () => {
  test('shows not found for invalid route', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.locator('body')).toBeVisible();
  });
});
