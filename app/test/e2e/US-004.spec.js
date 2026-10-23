// US-004 — Desk grid of the selected floor (free / taken, no names) — Variant A
import { test, expect } from '@playwright/test';
import { booking, day, doc, floorTab, many, openApp, store, tile } from './helpers.js';

const THU = 'Thu 2026-10-22';

test('Grid shows all desks of the floor', async ({ page }) => {
  await openApp(page);
  await store(page, doc([]));
  await day(page, THU).click();
  await floorTab(page, 2).click();
  const tiles = page.locator('#grid').getByRole('button');
  await expect(tiles).toHaveCount(25);
  await expect(tiles.first()).toHaveAccessibleName('F2-01 free');
  await expect(tiles.last()).toHaveAccessibleName('F2-25 free');
});

test('Grid shows all desks of Floor 1 (CHG-002, S2-1)', async ({ page }) => {
  await openApp(page);
  await store(page, doc([]));
  await day(page, THU).click();
  await floorTab(page, 1).click();
  const tiles = page.locator('#grid').getByRole('button');
  await expect(tiles).toHaveCount(35);
  await expect(tiles.first()).toHaveAccessibleName('F1-01 free');
  await expect(tiles.last()).toHaveAccessibleName('F1-35 free');
});

test('Taken desk without a name (Variant A)', async ({ page }) => {
  await openApp(page);
  await store(page, doc([booking({ showName: true })])); // "Alex Morgan", F1-07, 2026-10-22
  // The names switch is Off by default (US-010 adds the control).
  await day(page, THU).click();
  await floorTab(page, 1).click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken');
  await expect(tile(page, 'F1-07')).toContainText('taken');
  await expect(page.locator('body')).not.toContainText('Alex Morgan');
});

test('Grid follows the date', async ({ page }) => {
  await openApp(page);
  await store(page, doc([booking()]));
  await day(page, THU).click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken');
  await day(page, 'Fri 2026-10-23').click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 free');
});

test('Full floor', async ({ page }) => {
  await openApp(page);
  await store(page, doc(many('2026-10-22', 2, 25)));
  await day(page, THU).click();
  await floorTab(page, 2).click();
  await expect(page.locator('#grid').getByRole('button')).toHaveCount(25);
  await expect(page.locator('#grid').getByRole('button', { name: / free$/ })).toHaveCount(0);
});
