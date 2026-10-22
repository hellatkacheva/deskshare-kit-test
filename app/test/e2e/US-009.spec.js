// US-009 — Auto-release of bookings not checked in
import { test, expect } from '@playwright/test';
import { booking, doc, floorTab, many, office, openApp, store, tile } from './helpers.js';

const jamie = booking({ desk: 'F2-03', floor: 2, name: 'Jamie Lee', nameKey: 'jamie lee' }); // 2026-10-22, deadline 10:00
const fullFloor2 = () => [...many('2026-10-22', 2, 2), jamie, ...many('2026-10-22', 2, 22, { checkedInAt: '2026-10-22T09:00' }, 4)]
  .map((b, i) => (i < 2 ? { ...b, checkedInAt: '2026-10-22T09:00' } : b));

test('Booking released after the deadline (state effect)', async ({ page }) => {
  await openApp(page, { at: '2026-10-22T09:30' });
  await store(page, doc(fullFloor2()));
  await floorTab(page, 2).click();
  await expect(page.getByText('Floor 2: 25 booked · 0 left')).toBeVisible();
  await page.clock.setSystemTime(office('2026-10-22T10:01'));
  await page.reload();
  await floorTab(page, 2).click();
  await expect(tile(page, 'F2-03')).toHaveAccessibleName('F2-03 free');
  await expect(page.getByText('Floor 2: 24 booked · 1 left')).toBeVisible();
});

test('Released without anyone using the app at 10:00', async ({ page }) => {
  await openApp(page, { at: '2026-10-22T09:00' });
  await store(page, doc([jamie]));
  await page.goto('about:blank'); // app closed from 09:00 to 11:00
  await page.clock.setSystemTime(office('2026-10-22T11:00'));
  await page.goto('/');
  await floorTab(page, 2).click();
  await expect(tile(page, 'F2-03')).toHaveAccessibleName('F2-03 free');
});

test('Page left open with no interaction (DEC-028)', async ({ page }) => {
  await openApp(page, { at: '2026-10-22T09:59' });
  await store(page, doc(fullFloor2()));
  await floorTab(page, 2).click();
  await expect(tile(page, 'F2-03')).toHaveAccessibleName('F2-03 taken');
  await page.clock.runFor('02:00'); // nobody touches the page until 10:01
  await expect(tile(page, 'F2-03')).toHaveAccessibleName('F2-03 free');
  await expect(page.getByText('Floor 2: 24 booked · 1 left')).toBeVisible();
});
