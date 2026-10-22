// US-006 — Hard stop when the floor is full
import { test, expect } from '@playwright/test';
import {
  bookDesk, booking, cancelDesk, day, dialog, doc, floorTab, many, office, openApp, store, stored, tile,
} from './helpers.js';

const THU = 'Thu 2026-10-22';
const FULL_MSG = 'This floor is full for this day — please pick another day or floor.';

async function onThursday(page, bookings, floor) {
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc(bookings));
  await day(page, THU).click();
  await floorTab(page, floor).click();
}

test('Last free desk can be booked (boundary — capacity − 1)', async ({ page }) => {
  await onThursday(page, many('2026-10-22', 2, 24), 2);
  await bookDesk(page, 'F2-25', 'Jamie Lee');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Floor 2: 25 booked · 0 left')).toBeVisible();
});

test('Full floor refuses a new booking (boundary — at capacity)', async ({ page }) => {
  await onThursday(page, many('2026-10-22', 2, 25), 2);
  await expect(page.locator('#grid').getByRole('button', { name: / free$/ })).toHaveCount(0);
  await expect(page.getByText(FULL_MSG)).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/waitlist|waiting list/i);
});

test('Last desk taken in another tab (re-check at save)', async ({ context }) => {
  const one = await context.newPage();
  await onThursday(one, many('2026-10-22', 2, 24), 2);
  const two = await context.newPage();
  await two.clock.install({ time: office('2026-10-21T16:00') });
  await two.goto('/');
  await day(two, THU).click();
  await floorTab(two, 2).click();
  await expect(tile(two, 'F2-25')).toHaveAccessibleName('F2-25 free');

  await bookDesk(one, 'F2-25', 'Jamie Lee');
  await expect(dialog(one).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await bookDesk(two, 'F2-25', 'Sam Rivera');
  await expect(dialog(two).getByText(FULL_MSG)).toBeVisible();
  await dialog(two).getByRole('button', { name: 'Close' }).click();
  await expect(two.getByText('Floor 2: 25 booked · 0 left')).toBeVisible();
  expect(JSON.parse(await stored(two)).bookings.filter((b) => b.floor === 2)).toHaveLength(25);
});

test('Other floor and other day stay bookable', async ({ page }) => {
  await onThursday(page, [...many('2026-10-22', 2, 25), ...many('2026-10-22', 1, 12)], 2);
  await floorTab(page, 1).click();
  await bookDesk(page, 'F1-20', 'Sam Rivera');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
});

test('Cancel on a full floor frees a desk (state effect)', async ({ page }) => {
  // added with US-007 (cancel)
  const full = many('2026-10-22', 2, 24);
  full.push(booking({ desk: 'F2-25', floor: 2, name: 'Jamie Lee', nameKey: 'jamie lee' }));
  await onThursday(page, full, 2);
  await expect(page.getByText(FULL_MSG)).toBeVisible();
  await cancelDesk(page, 'F2-25', 'Jamie Lee');
  await expect(page.getByText('Floor 2: 24 booked · 1 left')).toBeVisible();
  await expect(tile(page, 'F2-25')).toHaveAccessibleName('F2-25 free');
});
