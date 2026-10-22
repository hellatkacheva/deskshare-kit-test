// US-001 — Bookings kept in this browser, with the demo banner
import { test, expect, chromium } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BANNER, KEY, bookDesk, booking, cancelDesk, checkInDesk, day, dialog, doc, office, openApp, store, stored, tile,
} from './helpers.js';

const ALEX = booking(); // F1-07 on Thu 2026-10-22, "Alex Morgan"

test('Banner on every screen', async ({ page }) => {
  // Screens: Book view, booking form, confirmation, desk dialog (cancel + check-in), Tomorrow.
  await openApp(page);
  await expect(page.locator('#banner')).toHaveText(BANNER);
  await expect(page.locator('#banner')).toBeVisible();
  await day(page, 'Thu 2026-10-22').click();
  await tile(page, 'F1-04').click(); // free in the seed (demo-data.md §6)
  await expect(dialog(page).locator('.dialog-banner')).toHaveText(BANNER);
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.getByRole('button', { name: 'Book desk' }).click();
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await expect(dialog(page).locator('.dialog-banner')).toHaveText(BANNER);
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await tile(page, 'F1-04').click(); // cancel dialog (US-007)
  await expect(dialog(page).locator('.dialog-banner')).toHaveText(BANNER);
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await page.getByRole('link', { name: 'Tomorrow' }).click(); // US-013
  await expect(page.locator('#tomorrow-view')).toBeVisible();
  await expect(page.locator('#banner')).toBeVisible();
  await expect(page.locator('#banner')).toHaveText(BANNER);
});

test('Data survives a reload (state effect)', async ({ page }) => {
  await openApp(page);
  await store(page, doc([ALEX]));
  await page.reload();
  expect(JSON.parse(await stored(page)).bookings).toEqual([ALEX]);
  await day(page, 'Thu 2026-10-22').click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken'); // US-004
});

test('Data survives a browser restart', async ({}, testInfo) => {
  const dir = mkdtempSync(join(tmpdir(), 'deskshare-'));
  const { baseURL } = testInfo.project.use;
  try {
    let ctx = await chromium.launchPersistentContext(dir, { baseURL });
    let page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.clock.install({ time: office('2026-10-21T08:00') });
    await page.goto('/');
    await store(page, doc([ALEX]));
    await ctx.close();

    ctx = await chromium.launchPersistentContext(dir, { baseURL });
    page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.clock.install({ time: office('2026-10-21T08:00') });
    await page.goto('/');
    expect(JSON.parse(await stored(page)).bookings).toEqual([ALEX]);
    await day(page, 'Thu 2026-10-22').click();
    await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken'); // US-004
    await ctx.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Storage not available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('blocked', 'SecurityError'); },
    });
  });
  await openApp(page);
  await expect(page.getByText('Bookings cannot be saved in this browser — browser storage is turned off.')).toBeVisible();
  await tile(page, 'F1-07').click(); // US-005: a free desk opens no booking form
  await expect(page.getByRole('button', { name: /book/i })).toHaveCount(0);
});

test('Saved data cannot be read (DEC-031)', async ({ page }) => {
  const damaged = '{"version":1,"bookings":[';
  await openApp(page);
  await store(page, damaged);
  await expect(page.getByText('Saved bookings could not be read in this browser. Clear site data to reload demo data.')).toBeVisible();
  await expect(page.getByRole('button', { name: /book|cancel|check in/i })).toHaveCount(0);
  expect(await stored(page)).toBe(damaged);
});

test('No network calls with booking data', async ({ page, baseURL }) => {
  const requests = [];
  page.on('request', (r) => requests.push(r));
  await openApp(page);
  await page.waitForLoadState('networkidle');
  for (const r of requests) {
    expect(r.method()).toBe('GET');
    expect(r.url().startsWith(baseURL)).toBe(true);
    expect(r.postData()).toBeNull();
  }
  const afterLoad = requests.length;
  await page.clock.runFor('02:00'); // two refresh ticks
  await day(page, 'Thu 2026-10-22').click();
  await bookDesk(page, 'F1-04', 'Alex Morgan'); // US-005
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await cancelDesk(page, 'F1-04', 'Alex Morgan'); // US-007
  await expect(tile(page, 'F1-04')).toHaveAccessibleName('F1-04 free');
  await day(page, 'Wed 2026-10-21').click();
  await checkInDesk(page, 'F1-14', 'Grace Holm'); // US-008 — seeded, not checked in, deadline 10:00
  await expect(dialog(page).getByText('Checked in ✓')).toBeVisible();
  expect(requests.length).toBe(afterLoad);
});

test('Another browser does not see the data', async ({ browser }) => {
  const one = await browser.newContext();
  const two = await browser.newContext();
  const p1 = await one.newPage();
  await p1.goto('/');
  await store(p1, doc([ALEX]));
  const p2 = await two.newPage();
  await p2.goto('/');
  const raw = await p2.evaluate((k) => localStorage.getItem(k), KEY);
  expect(raw === null || !raw.includes('Alex Morgan')).toBe(true);
  await one.close();
  await two.close();
});
