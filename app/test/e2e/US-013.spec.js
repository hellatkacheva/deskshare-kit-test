// US-013 — "Tomorrow" screen for the Office Manager
import { test, expect } from '@playwright/test';
import {
  booking, cancelDesk, doc, floorCard, many, namesSwitch, office, openApp, openTomorrow, store,
} from './helpers.js';

test('Tomorrow on a weekday', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await openTomorrow(page);
  await expect(page.getByRole('heading', { name: 'Tomorrow — Thu 2026-10-22' })).toBeVisible();
});

test('Screen left open over midnight (DEC-028)', async ({ page }) => {
  await page.clock.install({ time: office('2026-10-21T23:59') });
  await page.goto('/#/tomorrow');
  await expect(page.getByRole('heading', { name: 'Tomorrow — Thu 2026-10-22' })).toBeVisible();
  await page.clock.runFor('02:00');
  await expect(page.getByRole('heading', { name: 'Tomorrow — Fri 2026-10-23' })).toBeVisible();
});

test('Floor 2 full', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' }); // seed: D1 Floor 2 = 25 of 25
  await openTomorrow(page);
  await expect(floorCard(page, 2)).toContainText('25 / 25');
  await expect(floorCard(page, 2)).toContainText('RED');
});

test('Seeded demo state (DEC-034)', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' }); // seed: D1 Floor 1 = 30 of 35, Floor 2 = 25 of 25
  await openTomorrow(page);
  await expect(floorCard(page, 1)).toContainText('30 / 35');
  await expect(floorCard(page, 1)).toContainText('AMBER');
  await expect(floorCard(page, 2)).toContainText('25 / 25');
  await expect(floorCard(page, 2)).toContainText('RED');
});

test('Status follows a cancel (state effect)', async ({ page }) => {
  const full = many('2026-10-22', 2, 24);
  full.push(booking({ desk: 'F2-25', floor: 2, name: 'Jamie Lee', nameKey: 'jamie lee' }));
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc(full));
  await page.getByRole('button', { name: 'Thu 2026-10-22', exact: true }).click();
  await page.getByRole('button', { name: /^Floor 2 ·/ }).click();
  await cancelDesk(page, 'F2-25', 'Jamie Lee');
  await openTomorrow(page);
  await expect(floorCard(page, 2)).toContainText('24 / 25');
  await expect(floorCard(page, 2)).toContainText('AMBER');
});

test('No names', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc([booking({ showName: true })]));
  await namesSwitch(page).click();
  await openTomorrow(page);
  await expect(page.locator('#tomorrow-view')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Alex Morgan');
});
