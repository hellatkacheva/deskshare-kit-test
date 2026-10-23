import { defineConfig, devices } from '@playwright/test';

// test-plan.md §1 — E2E against the static server; office zone proven with a non-UTC+5 device zone.
// With BASE_URL set, only the deployed smoke test runs (test-plan.md §5) — real clock, no local server.
const PORT = 4173;
const PHONE = { width: 375, height: 667 };
const DEPLOYED = process.env.BASE_URL;

export default defineConfig({
  testDir: './test/e2e',
  testMatch: /US-\d+\.spec\.js/,
  fullyParallel: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    timezoneId: 'Europe/Berlin',
  },
  webServer: DEPLOYED ? undefined : {
    command: 'node scripts/serve.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
  projects: DEPLOYED
    ? [{ name: 'deployed', testMatch: /deployed\.smoke\.spec\.js/, use: { ...devices['Desktop Chrome'], baseURL: DEPLOYED } }]
    : [
      { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
      // US-015 only (test-plan.md §1)
      { name: 'msedge', testMatch: /US-015\.spec\.js/, use: { ...devices['Desktop Edge'], channel: 'msedge' } },
      { name: 'mobile-chrome', testMatch: /US-015\.spec\.js/, use: { ...devices['Pixel 5'], viewport: PHONE } },
      { name: 'mobile-webkit', testMatch: /US-015\.spec\.js/, use: { ...devices['iPhone SE'], viewport: PHONE } },
    ],
});
