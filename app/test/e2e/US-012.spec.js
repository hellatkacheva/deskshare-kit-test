// US-012 — Notice: names are self-reported
import { test, expect } from '@playwright/test';
import { booking, day, dialog, doc, floorTab, openApp, store, tile } from './helpers.js';

const NOTICE = 'Names are self-reported — not for emergency headcount.';
// D0 seed names (demo-data.md §4)
const TODAY_NAMES = ['Ava Morgan', 'Ben Carter', 'Chloe Diaz', 'Daniel Brooks', 'Ella Novak', 'Felix Grant',
  'Grace Holm', 'Hugo Silva', 'Isla Byrne', 'Jonas Weber', 'Kira Patel', 'Leo Marsh', 'Maya Lund',
  'Noah Petrov', 'Olivia Reyes', 'Pablo Ortiz', 'Quinn Adler', 'Rosa Haas'];

test('Notice on the booking form', async ({ page }) => {
  await openApp(page);
  await store(page, doc([]));
  await day(page, 'Thu 2026-10-22').click();
  await tile(page, 'F1-07').click();
  await expect(dialog(page).getByText(NOTICE)).toBeVisible();
});

test('Notice on the cancel name field', async ({ page }) => {
  await openApp(page);
  await store(page, doc([booking()]));
  await day(page, 'Thu 2026-10-22').click();
  await tile(page, 'F1-07').click();
  await expect(dialog(page).getByText(NOTICE)).toBeVisible();
});

test('No headcount list', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' }); // seed: bookings for today
  const noNames = async () => {
    const text = await page.locator('body').innerText();
    for (const n of TODAY_NAMES) expect(text).not.toContain(n);
  };
  for (const floor of [1, 2]) {
    await floorTab(page, floor).click();
    await noNames(); // counts and desk grid
  }
  await floorTab(page, 1).click();
  await tile(page, 'F1-04').click(); // booking form (free desk)
  await noNames();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await tile(page, 'F1-02').click(); // cancel dialog (Ava Morgan's desk)
  await noNames();
  // "Tomorrow" (US-013) is added here when built.
});
