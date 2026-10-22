// US-003 — Choose a date and a floor, see booked and remaining desks
import { test, expect } from '@playwright/test';
import { day, doc, floorTab, many, office, openApp, store } from './helpers.js';

const THU = 'Thu 2026-10-22';
const busyThursday = doc([...many('2026-10-22', 1, 12), ...many('2026-10-22', 2, 25)]);

test('See booked and remaining desks for a date', async ({ page }) => {
  await openApp(page);
  await store(page, busyThursday);
  await day(page, THU).click();
  await expect(page.getByText('Floor 1: 12 booked · 18 left')).toBeVisible();
  await expect(page.getByText('Floor 2: 25 booked · 0 left')).toBeVisible();
});

test('Choose a floor', async ({ page }) => {
  await openApp(page);
  await day(page, THU).click();
  await floorTab(page, 2).click();
  await expect(floorTab(page, 2)).toHaveAttribute('aria-pressed', 'true');
  await expect(floorTab(page, 1)).toHaveAttribute('aria-pressed', 'false');
});

test('Booking window — last day and day after', async ({ page }) => {
  await openApp(page);
  await expect(day(page, 'Tue 2026-10-27')).toBeEnabled();
  await expect(day(page, 'Wed 2026-10-28')).toHaveCount(0);
});

test('Weekends and past dates cannot be chosen', async ({ page }) => {
  await openApp(page);
  await expect(day(page, 'Sat 2026-10-24')).toBeDisabled();
  await expect(day(page, 'Sun 2026-10-25')).toBeDisabled();
  await expect(day(page, 'Tue 2026-10-20')).toHaveCount(0);
});

test('Default date on a weekday', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await expect(day(page, 'Wed 2026-10-21')).toHaveAttribute('aria-pressed', 'true');
});

test('"Today" follows the office time zone', async ({ page }) => {
  // Device zone is Europe/Berlin (playwright.config.js); 20:30 UTC = 01:30 next day office time.
  await page.clock.install({ time: new Date('2026-10-21T20:30:00Z') });
  await page.goto('/');
  await expect(day(page, THU)).toHaveAttribute('aria-pressed', 'true');
  await expect(day(page, 'Wed 2026-10-21')).toHaveCount(0);
});

test('Date without bookings (empty state)', async ({ page }) => {
  await openApp(page);
  await store(page, doc(many('2026-10-22', 1, 3)));
  await day(page, 'Fri 2026-10-23').click();
  await expect(page.getByText('Floor 1: 0 booked · 30 left')).toBeVisible();
  await expect(page.getByText('Floor 2: 0 booked · 25 left')).toBeVisible();
});

test('Page left open over midnight (DEC-028)', async ({ page }) => {
  await page.clock.install({ time: office('2026-10-21T23:59') });
  await page.goto('/');
  await expect(day(page, 'Wed 2026-10-21')).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor('02:00'); // nobody touches the page until 00:01
  await expect(day(page, THU)).toHaveAttribute('aria-pressed', 'true');
  await expect(day(page, 'Wed 2026-10-21')).toHaveCount(0);
});

test('Counts after a reload', async ({ page }) => {
  await openApp(page);
  await store(page, busyThursday);
  await day(page, THU).click();
  await expect(page.getByText('Floor 1: 12 booked · 18 left')).toBeVisible();
  await page.reload();
  await day(page, THU).click();
  await expect(page.getByText('Floor 1: 12 booked · 18 left')).toBeVisible();
});
