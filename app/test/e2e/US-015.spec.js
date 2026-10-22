// US-015 — Demo smoke test on phone and desktop.
// Runs on chromium-desktop, msedge, mobile-chrome (375 × 667) and mobile-webkit (375 × 667) — test-plan.md §1.
// A fresh browser context = site data cleared (US-015 rule 5, DEC-031). Real phones: manual, demo-data.md §9.
import { test, expect } from '@playwright/test';
import {
  BANNER, bookDesk, cancelDesk, checkInDesk, day, dialog, floorTab, namesSwitch, openApp, tile,
} from './helpers.js';

const NOTICE = 'Names are self-reported — not for emergency headcount.';
const FULL = 'This floor is full for this day — please pick another day or floor.';

test('Core demo flow', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:30' }); // site data cleared, app opened at 08:30 on the test day

  // Select a date and a floor, book a free desk, cancel it — remaining −1 then +1.
  await day(page, 'Wed 2026-10-21').click();
  await floorTab(page, 1).click();
  await expect(page.getByText('Floor 1: 10 booked · 20 left')).toBeVisible();
  await tile(page, 'F1-01').click();
  await expect(page.locator('#banner')).toHaveText(BANNER);
  await expect(dialog(page).getByText(NOTICE)).toBeVisible(); // notice on the booking form
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await bookDesk(page, 'F1-01', 'Alex Morgan');
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Floor 1: 11 booked · 19 left')).toBeVisible();
  await cancelDesk(page, 'F1-01', 'Alex Morgan');
  await expect(page.getByText('Floor 1: 10 booked · 20 left')).toBeVisible();

  // Next working day: Floor 2 full — hard stop with the "pick another day or floor" message.
  await day(page, 'Thu 2026-10-22').click();
  await floorTab(page, 2).click();
  await expect(page.getByText(FULL)).toBeVisible();
  await expect(page.locator('#grid').getByRole('button', { name: / free$/ })).toHaveCount(0);

  // A seeded unconfirmed booking for today can be checked in before 10:00 (Grace Holm, F1-14).
  await day(page, 'Wed 2026-10-21').click();
  await floorTab(page, 1).click();
  await checkInDesk(page, 'F1-14', 'Grace Holm');
  await expect(dialog(page).getByText('Checked in ✓')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close' }).click();

  // Names switch: On shows consenting seed names, Off hides them.
  await namesSwitch(page).click();
  await expect(tile(page, 'F1-02')).toHaveAccessibleName('F1-02 Ava Morgan');
  await namesSwitch(page).click();
  await expect(tile(page, 'F1-02')).toHaveAccessibleName('F1-02 taken');

  await expect(page.locator('#banner')).toBeVisible();
});

test('No horizontal scrolling on the phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openApp(page, { at: '2026-10-21T08:30' });
  await namesSwitch(page).click(); // names on tiles too

  const check = async (scope) => {
    const width = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(width[0], 'horizontal scroll').toBeLessThanOrEqual(width[1]);
    const small = await scope.locator('button, [role="switch"]').evaluateAll((els) => els
      .filter((e) => e.offsetParent !== null)
      .map((e) => ({ name: e.getAttribute('aria-label') || e.textContent.trim(), w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }))
      .filter((b) => b.w < 44 || b.h < 44));
    expect(small, 'controls smaller than 44 × 44 CSS px').toEqual([]);
  };

  await check(page.locator('body')); // counts and grid
  await tile(page, 'F1-01').click(); // booking form
  await check(dialog(page));
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await tile(page, 'F1-14').click(); // desk dialog: cancel / check-in
  await check(dialog(page));
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await page.getByRole('link', { name: 'Tomorrow' }).click(); // US-013
  await expect(page.locator('#tomorrow-view')).toBeVisible();
  await check(page.locator('body'));
  const link = await page.getByRole('link', { name: 'Book' }).boundingBox();
  expect(link.height).toBeGreaterThanOrEqual(44);
});
