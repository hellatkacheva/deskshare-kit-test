// US-017 — Check-in deadline of a booking and closing of same-day booking
import { test, expect } from '@playwright/test';
import {
  bookDesk, booking, day, dialog, doc, floorTab, office, openApp, store, tile,
} from './helpers.js';

test('Booking made before the day', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc([]));
  await day(page, 'Thu 2026-10-22').click();
  await bookDesk(page, 'F1-07', 'Alex Morgan');
  await expect(dialog(page)).toContainText('check in by 10:00 office time (UTC+5)');
});

test('Same-day booking at 23:59 is refused (boundary)', async ({ page }) => {
  await page.clock.install({ time: office('2026-10-21T23:58') });
  await page.goto('/');
  await store(page, doc([]));
  await floorTab(page, 2).click();
  await page.clock.runFor('01:00'); // 23:59
  await bookDesk(page, 'F2-03', 'Jamie Lee');
  await expect(dialog(page).getByText('Booking for today is closed — please pick another date')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await day(page, 'Thu 2026-10-22').click();
  await bookDesk(page, 'F2-03', 'Jamie Lee');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
});

test('Time label on the check-in field', async ({ page }) => {
  await openApp(page, { at: '2026-10-22T09:00' });
  await store(page, doc([booking()])); // F1-07 on 2026-10-22, deadline 10:00
  await tile(page, 'F1-07').click();
  await expect(dialog(page)).toContainText('10:00 office time (UTC+5)');
});
