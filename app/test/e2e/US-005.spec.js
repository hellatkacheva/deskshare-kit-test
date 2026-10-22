// US-005 — Book a free desk
import { test, expect } from '@playwright/test';
import {
  bookDesk, booking, day, dialog, doc, floorTab, many, office, openApp, store, stored, tile,
} from './helpers.js';

const THU = 'Thu 2026-10-22';
// Floor 1 on Thu: 12 booked (F1-13…F1-24), F1-07 free.
const twelve = () => many('2026-10-22', 1, 12, {}, 13);

async function onThursday(page, bookings) {
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc(bookings));
  await day(page, THU).click();
}

test('Book a free desk (happy path)', async ({ page }) => {
  await onThursday(page, []);
  await floorTab(page, 1).click();
  await bookDesk(page, 'F1-07', 'Alex Morgan');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/pending|approval/i);
});

test('State effect of booking', async ({ page }) => {
  await onThursday(page, twelve());
  await expect(page.getByText('Floor 1: 12 booked · 18 left')).toBeVisible();
  await bookDesk(page, 'F1-07', 'Alex Morgan');
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken');
  await expect(page.getByText('Floor 1: 13 booked · 17 left')).toBeVisible();
  await page.reload();
  await day(page, THU).click();
  await expect(page.getByText('Floor 1: 13 booked · 17 left')).toBeVisible();
});

test('Taken desk cannot be booked', async ({ page }) => {
  await onThursday(page, [booking()]); // "Alex Morgan" on F1-07
  await tile(page, 'F1-07').click();
  await expect(page.getByRole('button', { name: 'Book desk' })).toHaveCount(0);
  expect(JSON.parse(await stored(page)).bookings).toEqual([booking()]);
  await expect(page.getByText('Floor 1: 1 booked · 29 left')).toBeVisible();
});

test('Second booking under the same name on the same day', async ({ page }) => {
  await onThursday(page, [booking()]);
  await floorTab(page, 2).click();
  await bookDesk(page, 'F2-03', 'Alex Morgan');
  await expect(dialog(page).getByText('This name already has a booking for that day.')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Floor 2: 0 booked · 25 left')).toBeVisible();
});

test('Two tabs — stale tab cannot double-book (re-check at save)', async ({ context }) => {
  const one = await context.newPage();
  await onThursday(one, twelve());
  const two = await context.newPage();
  await two.clock.install({ time: office('2026-10-21T16:00') });
  await two.goto('/');
  await day(two, THU).click();
  await expect(tile(two, 'F1-07')).toHaveAccessibleName('F1-07 free');

  await bookDesk(one, 'F1-07', 'Alex Morgan');
  await expect(dialog(one).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();

  await bookDesk(two, 'F1-07', 'Jamie Lee'); // tab 2 still shows F1-07 free
  await expect(dialog(two).getByText('This desk is already taken — pick another desk.')).toBeVisible();
  const data = JSON.parse(await stored(two)).bookings;
  expect(data.filter((b) => b.desk === 'F1-07').map((b) => b.name)).toEqual(['Alex Morgan']);
  expect(data.filter((b) => b.date === '2026-10-22' && b.floor === 1)).toHaveLength(13);
});

test('Date outside the window refused at save', async ({ page }) => {
  await page.clock.install({ time: office('2026-10-20T23:58') });
  await page.goto('/');
  await store(page, doc([]));
  await expect(day(page, 'Tue 2026-10-20')).toHaveAttribute('aria-pressed', 'true');
  await tile(page, 'F1-07').click();
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.clock.runFor('07:00'); // now Wed 2026-10-21 00:05; the form stays open
  await page.getByRole('button', { name: 'Book desk' }).click();
  await expect(dialog(page).getByText(/This date can't be booked — please pick a weekday/)).toBeVisible();
  expect(JSON.parse(await stored(page)).bookings).toEqual([]);
});

test('Confirmation content', async ({ page }) => {
  await onThursday(page, []);
  await bookDesk(page, 'F1-07', 'Alex Morgan');
  const d = dialog(page);
  await expect(d).toContainText('Thu 2026-10-22');
  await expect(d).toContainText('F1-07');
  await expect(d).toContainText('Note your desk number — you need it to check in or cancel');
  await expect(d).not.toContainText('Alex Morgan');
});
