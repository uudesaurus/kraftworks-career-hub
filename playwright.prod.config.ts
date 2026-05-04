import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for production e2e tests.
 * No local dev server needed — tests run against live URLs.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: 'list',
  timeout: 30000,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — production tests use absolute URLs
});
