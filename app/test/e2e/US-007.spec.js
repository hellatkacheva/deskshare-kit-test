// US-007 — Cancel my own booking
import { test, expect } from '@playwright/test';
import {
  booking, cancelDesk, day, dialog, doc, many, office, openApp, store, stored, tile,
} from './helpers.js';

const THU = 'Thu 2026-10-22';
const ALEX = booking(); // "Alex Morgan", F1-07, 2026-10-22

async function onThursday(page, bookings, at = '2026-10-21T16:00') {
  await openApp(page, { at });
  await store(page, doc(bookings));
  await day(page, THU).click();
}

test('Cancel own booking before the booking day (happy path)', async ({ page }) => {
  await onThursday(page, [ALEX]);
  await cancelDesk(page, 'F1-07', 'Alex Morgan');
  await expect(dialog(page)).toHaveCount(0);
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 free');
});

test('Booking already cancelled in another tab (re-check at save)', async ({ context }) => {
  const one = await context.newPage();
  await onThursday(one, [ALEX, ...many('2026-10-22', 1, 12, {}, 13)]);
  const two = await context.newPage();
  await two.clock.install({ time: office('2026-10-21T16:00') });
  await two.goto('/');
  await day(two, THU).click();
  await expect(tile(two, 'F1-07')).toHaveAccessibleName('F1-07 taken');

  await cancelDesk(one, 'F1-07', 'Alex Morgan');
  await cancelDesk(two, 'F1-07', 'Alex Morgan');
  await expect(dialog(two).getByText('There is no booking for F1-07 on Thu 2026-10-22.')).toBeVisible();
  expect(JSON.parse(await stored(two)).bookings.filter((b) => b.floor === 1)).toHaveLength(12);
});

test('State effect of cancel', async ({ page }) => {
  await onThursday(page, [ALEX, ...many('2026-10-22', 1, 12, {}, 13)]);
  await expect(page.getByText('Floor 1: 13 booked · 22 left')).toBeVisible();
  await cancelDesk(page, 'F1-07', 'Alex Morgan');
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 free');
  await expect(page.getByText('Floor 1: 12 booked · 23 left')).toBeVisible();
  await page.reload();
  await day(page, THU).click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 free');
});

test('Name match ignores case and extra spaces', async ({ page }) => {
  await onThursday(page, [ALEX]);
  await cancelDesk(page, 'F1-07', '  alex   MORGAN ');
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 free');
});

test('Wrong name', async ({ page }) => {
  await onThursday(page, [ALEX]);
  await cancelDesk(page, 'F1-07', 'Alex Morgen');
  await expect(dialog(page).getByText('The name does not match the booking.')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken');
  await expect(page.getByText('Floor 1: 1 booked · 34 left')).toBeVisible();
});
