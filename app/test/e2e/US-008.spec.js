// US-008 — Check in to my booking
import { test, expect } from '@playwright/test';
import { booking, checkInDesk, day, dialog, doc, openApp, store, stored, tile } from './helpers.js';

const NOTICE = 'Names are self-reported — not for emergency headcount.';

async function onBookingDay(page, at = '2026-10-22T09:10', bookings = [booking()]) {
  await openApp(page, { at });
  await store(page, doc(bookings)); // "Alex Morgan", F1-07, 2026-10-22, deadline 10:00
}

test('Check in before the deadline (happy path)', async ({ page }) => {
  await onBookingDay(page);
  await checkInDesk(page, 'F1-07', 'Alex Morgan');
  await expect(dialog(page).getByText('Checked in ✓')).toBeVisible();
});

test('State effect of check-in', async ({ page }) => {
  await onBookingDay(page);
  await checkInDesk(page, 'F1-07', 'Alex Morgan');
  await expect(dialog(page).getByText('Checked in ✓')).toBeVisible();
  await page.reload();
  expect(JSON.parse(await stored(page)).bookings[0].checkedInAt).toBe('2026-10-22T09:10');
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken');
});

test('Check-in before the booking day is refused', async ({ page }) => {
  await onBookingDay(page, '2026-10-21T16:00');
  await day(page, 'Thu 2026-10-22').click();
  await tile(page, 'F1-07').click();
  await expect(dialog(page).getByText('Check-in is only possible on the booking day.')).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Check in' })).toHaveCount(0);
});

test('Exactly at the deadline is too late (boundary)', async ({ page }) => {
  await onBookingDay(page, '2026-10-22T09:59');
  await tile(page, 'F1-07').click();
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.clock.runFor('01:00'); // 10:00 — the dialog stays open
  await page.getByRole('button', { name: 'Check in' }).click();
  // The 10:00 tick may release the booking before the click (B-5): either refusal text is correct.
  const tooLate = 'Too late — the booking was released at 10:00 office time (UTC+5).';
  const gone = 'There is no booking for F1-07 on Thu 2026-10-22.';
  await expect(dialog(page).locator('.error')).toHaveText(new RegExp(`^(${escape(tooLate)}|${escape(gone)})$`));
  await expect(dialog(page).getByText('Checked in ✓')).toHaveCount(0);
});

test('Second check-in', async ({ page }) => {
  await onBookingDay(page, '2026-10-22T09:20', [booking({ checkedInAt: '2026-10-22T09:10' })]);
  await checkInDesk(page, 'F1-07', 'Alex Morgan');
  await expect(dialog(page).getByText('This booking is already checked in.')).toBeVisible();
  expect(JSON.parse(await stored(page)).bookings[0].checkedInAt).toBe('2026-10-22T09:10');
});

test('Notice on the check-in name field', async ({ page }) => {
  await onBookingDay(page);
  await tile(page, 'F1-07').click();
  await expect(dialog(page).getByRole('button', { name: 'Check in' })).toBeVisible();
  await expect(dialog(page).getByText(NOTICE)).toBeVisible();
});

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
