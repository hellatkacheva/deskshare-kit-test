// US-010 — Demo switch "Show colleagues' names" (A/B switch, group AB-1)
import { test, expect } from '@playwright/test';
import { KEY, namesSwitch, openApp, tile } from './helpers.js';

// Seed (demo-data.md §4): today F1-02 Ava Morgan (consent), F1-08 Daniel Brooks (no consent).
const consentOf = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).bookings.map((b) => b.showName), KEY);

test('Default is Off', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await expect(namesSwitch(page)).toHaveAttribute('aria-checked', 'false');
  await expect(namesSwitch(page)).toContainText('Off');
  await expect(tile(page, 'F1-02')).toHaveAccessibleName('F1-02 taken');
});

test('Turn On and Off', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await namesSwitch(page).click();
  await expect(namesSwitch(page)).toHaveAttribute('aria-checked', 'true');
  await expect(namesSwitch(page)).toContainText('On');
  await expect(tile(page, 'F1-02')).toHaveAccessibleName('F1-02 Ava Morgan'); // Variant B
  await namesSwitch(page).click();
  await expect(tile(page, 'F1-02')).toHaveAccessibleName('F1-02 taken'); // Variant A
});

test('Switching keeps bookings (state effect)', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await expect(page.getByText('Floor 1: 10 booked · 20 left')).toBeVisible();
  const before = await consentOf(page);
  await namesSwitch(page).click();
  await namesSwitch(page).click();
  await expect(page.getByText('Floor 1: 10 booked · 20 left')).toBeVisible();
  expect(await consentOf(page)).toEqual(before);
});

test('Off again after a reload', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await namesSwitch(page).click();
  await expect(namesSwitch(page)).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(namesSwitch(page)).toHaveAttribute('aria-checked', 'false');
  await expect(tile(page, 'F1-02')).toHaveAccessibleName('F1-02 taken');
});
