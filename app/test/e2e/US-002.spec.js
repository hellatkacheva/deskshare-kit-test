// US-002 — Seed demo data
import { test, expect } from '@playwright/test';
import { booking, doc, openApp, store, stored } from './helpers.js';

const seedOf = async (page) => JSON.parse(await stored(page));

test('First open loads the seed', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  const data = await seedOf(page);
  expect(data.bookings).toHaveLength(86);
  const window = ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26', '2026-10-27'];
  for (const b of data.bookings) {
    expect(b.name.length).toBeGreaterThan(0);
    expect(b.desk).toMatch(/^F1-(0[1-9]|[12]\d|30)$|^F2-(0[1-9]|1\d|2[0-5])$/);
    expect(window).toContain(b.date);
  }
});

test('Team-only reset in the local / test build (state effect)', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00' });
  await store(page, doc([booking()])); // presenter's booking of F1-07 on 2026-10-22
  await page.goto('/?reset-demo');
  const data = await seedOf(page);
  expect(data.bookings.some((b) => b.name === 'Alex Morgan')).toBe(false);
  expect(data.bookings).toHaveLength(86);
  expect(data.seededAt).toBe('2026-10-21T08:00');
});

test('Reset parameter removed after the reset', async ({ page }) => {
  await openApp(page, { at: '2026-10-21T08:00', path: '/?reset-demo' });
  await expect(page).not.toHaveURL(/reset-demo/);
  const data = await seedOf(page);
  // The story's F1-12 is taken by the seed on D1; F1-10 is a free desk there (demo-data.md §6).
  data.bookings.push(booking({ desk: 'F1-10' }));
  await store(page, data); // store() reloads the page
  await expect(page).not.toHaveURL(/reset-demo/);
  expect((await seedOf(page)).bookings.some((b) => b.desk === 'F1-10' && b.name === 'Alex Morgan')).toBe(true);
});

test('No visible reset control', async ({ page }) => {
  // Every screen: Book view, booking form, desk dialog (cancel / check-in), Tomorrow.
  await openApp(page, { at: '2026-10-21T08:00' });
  const noReset = async () => {
    await expect(page.getByRole('button', { name: /reset/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /reset/i })).toHaveCount(0);
  };
  await noReset();
  await page.getByRole('button', { name: /^F1-01 / }).click(); // booking form (free in the seed)
  await noReset();
  await page.locator('dialog[open]').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: /^F1-14 / }).click(); // desk dialog
  await noReset();
  await page.locator('dialog[open]').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('link', { name: 'Tomorrow' }).click();
  await noReset();
});
