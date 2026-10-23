// Smoke test of the deployed app (test-plan.md §5, S-1…S-6). Run by the `deploy` step:
//   BASE_URL=https://<owner>.github.io/<repo>/ npx playwright test --project=deployed
// Real clock, fresh browser context (= site data cleared). The test hooks must have no effect here.
import { test, expect } from '@playwright/test';

const BANNER = 'Demo — bookings are stored in this browser only.';
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Office date (UTC+5) from the real clock, and the seed's D1 (demo-data.md §1).
function officeDate(offsetDays = 0) {
  const d = new Date(Date.now() + 5 * 3600 * 1000 + offsetDays * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}
const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();
const isWorking = (date) => weekday(date) >= 1 && weekday(date) <= 5;
function nextWorking(date) {
  let d = date;
  do {
    d = new Date(Date.parse(`${d}T00:00:00Z`) + 86400 * 1000).toISOString().slice(0, 10);
  } while (!isWorking(d));
  return d;
}
const label = (date) => `${WD[weekday(date)]} ${date}`;
const today = officeDate();
const d0 = isWorking(today) ? today : nextWorking(today);
const d1 = nextWorking(d0);

const day = (page, date) => page.getByRole('button', { name: label(date), exact: true });
const tile = (page, desk) => page.getByRole('button', { name: new RegExp(`^${desk} `) });
const dialog = (page) => page.locator('dialog[open]');

async function onD1(page, floor) {
  await day(page, d1).click();
  await page.getByRole('button', { name: new RegExp(`^Floor ${floor} ·`) }).click();
}

test('S-1 · banner and seed on first open', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#banner')).toHaveText(BANNER);
  await onD1(page, 2);
  await expect(page.getByText('Floor 2: 25 booked · 0 left')).toBeVisible();
});

test('S-2 / S-3 · book and cancel, no requests after load', async ({ page, baseURL }) => {
  const requests = [];
  page.on('request', (r) => requests.push(r));
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  const origin = new URL(baseURL).origin;
  for (const r of requests) {
    expect(r.method()).toBe('GET');
    expect(r.url().startsWith(origin)).toBe(true);
  }
  const afterLoad = requests.length;

  await onD1(page, 1);
  await expect(page.getByText('Floor 1: 30 booked · 5 left')).toBeVisible();
  await tile(page, 'F1-04').click(); // free on D1 (demo-data.md §6)
  await page.getByLabel('Your name').fill('Smoke Test');
  await page.getByRole('button', { name: 'Book desk' }).click();
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Floor 1: 31 booked · 4 left')).toBeVisible();
  await tile(page, 'F1-04').click();
  await page.getByLabel('Your name').fill('Smoke Test');
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await expect(page.getByText('Floor 1: 30 booked · 5 left')).toBeVisible();
  expect(requests.length, 'requests after load').toBe(afterLoad);
});

test('S-4 · ?now= is ignored', async ({ page }) => {
  await page.goto('./?now=2027-01-05T09:00');
  await expect(day(page, d0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#date-strip')).not.toContainText('2027');
  await expect(page.getByRole('button', { name: /2027-01-05/ })).toHaveCount(0);
});

test('S-5 · ?reset-demo is ignored', async ({ page }) => {
  await page.goto('./');
  await onD1(page, 1);
  await tile(page, 'F1-10').click();
  await page.getByLabel('Your name').fill('Smoke Test');
  await page.getByRole('button', { name: 'Book desk' }).click();
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await page.goto('./?reset-demo');
  await onD1(page, 1);
  await expect(tile(page, 'F1-10')).toHaveAccessibleName('F1-10 taken');
});

test('S-6 · 375 × 667 without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./');
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(client);
});
