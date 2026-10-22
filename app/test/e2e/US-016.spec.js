// US-016 — Name rules when booking
import { test, expect } from '@playwright/test';
import { bookDesk, day, dialog, doc, openApp, store, stored, tile } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc([]));
  await day(page, 'Thu 2026-10-22').click();
});

test('Name of spaces only', async ({ page }) => {
  await bookDesk(page, 'F1-07', '   ');
  await expect(dialog(page).getByText('Please enter your name.')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 free');
  await expect(page.getByText('Floor 1: 0 booked · 30 left')).toBeVisible();
});

test('Empty name', async ({ page }) => {
  await bookDesk(page, 'F1-07', '');
  await expect(dialog(page).getByText('Please enter your name.')).toBeVisible();
});

test('Name of 51 characters (boundary + 1)', async ({ page }) => {
  await bookDesk(page, 'F1-08', 'a'.repeat(51));
  await expect(dialog(page).getByText('Name is too long — maximum 50 characters.')).toBeVisible();
  expect(JSON.parse(await stored(page)).bookings).toEqual([]);
});
