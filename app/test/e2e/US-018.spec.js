// US-018 — Optional note with my booking (Next band, CHG-004, DEC-036)
import { test, expect } from '@playwright/test';
import {
  booking, day, dialog, doc, floorTab, namesSwitch, openApp, store, stored, tile,
} from './helpers.js';

const THU = 'Thu 2026-10-22';
const HINT = 'Optional, up to 50 characters. Please do not include names.';

async function onThursday(page, bookings = [], at = '2026-10-21T16:00') {
  await openApp(page, { at });
  await store(page, doc(bookings));
  await day(page, THU).click();
  await floorTab(page, 1).click();
}

async function bookWithNote(page, desk, name, note) {
  await tile(page, desk).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByLabel('Note (optional)').fill(note);
  await page.getByRole('button', { name: 'Book desk' }).click();
}

test('Book with a note (happy path)', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', 'need a second monitor');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await expect(dialog(page).getByText('Your note: need a second monitor')).toBeVisible();
  await expect(dialog(page)).not.toContainText('Alex Morgan');
});

test('Book without a note', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', '');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await expect(dialog(page)).not.toContainText('Your note:');
});

test('Note of 51 characters is refused (boundary + 1)', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', 'a'.repeat(51));
  await expect(dialog(page).getByText('The note can have at most 50 characters.')).toBeVisible();
  expect(JSON.parse(await stored(page)).bookings).toHaveLength(0);
});

test('Hint on the note field', async ({ page }) => {
  await onThursday(page);
  await tile(page, 'F1-04').click();
  await expect(dialog(page).getByText(HINT)).toBeVisible();
  await expect(page.getByLabel('Note (optional)')).not.toHaveAttribute('maxlength');
});

test('Note in the desk dialog, names switch Off and On', async ({ page }) => {
  await onThursday(page, [booking({ desk: 'F1-04', note: 'visiting from another office', showName: true })]);
  await tile(page, 'F1-04').click();
  await expect(dialog(page).getByText('Note: visiting from another office')).toBeVisible();
  await expect(dialog(page)).not.toContainText('Alex Morgan');
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await namesSwitch(page).click();
  await tile(page, 'F1-04').click();
  await expect(dialog(page).getByText('Note: visiting from another office')).toBeVisible();
});

test('Note is plain text', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', '<b>bold</b>');
  await expect(dialog(page).getByText('Your note: <b>bold</b>')).toBeVisible();
  await expect(dialog(page).locator('b')).toHaveCount(0);
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await tile(page, 'F1-04').click();
  await expect(dialog(page).getByText('Note: <b>bold</b>')).toBeVisible();
  await expect(dialog(page).locator('b')).toHaveCount(0);
});

test('Note not on tiles or counts', async ({ page }) => {
  await onThursday(page, [booking({ desk: 'F1-04', note: 'need a second monitor', showName: true })]);
  await expect(page.locator('#grid')).not.toContainText('need a second monitor');
  await expect(page.locator('#counts')).not.toContainText('need a second monitor');
  await namesSwitch(page).click();
  await expect(page.locator('#grid')).not.toContainText('need a second monitor');
});

test('Note kept after a reload', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', 'need a second monitor');
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await page.reload();
  await day(page, THU).click();
  await floorTab(page, 1).click();
  await tile(page, 'F1-04').click();
  await expect(dialog(page).getByText('Note: need a second monitor')).toBeVisible();
});

test('Note removed on auto-release (state effect)', async ({ page }) => {
  // Booked for Thu, not checked in (deadline 10:00); at 10:05 on Thu Jamie Lee books the same desk without a note.
  await openApp(page, { at: '2026-10-22T10:05' });
  await store(page, doc([booking({ desk: 'F1-04', note: 'need a second monitor' })]));
  await floorTab(page, 1).click();
  await bookWithNote(page, 'F1-04', 'Jamie Lee', '');
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await tile(page, 'F1-04').click();
  await expect(dialog(page)).not.toContainText('Note:');
  expect(await stored(page)).not.toContain('need a second monitor');
});

test('Bookings saved before notes existed stay readable (DEC-031)', async ({ page }) => {
  await onThursday(page, [booking({ desk: 'F1-07' })]); // a version-1 booking without a note field
  await expect(page.getByText('Floor 1: 1 booked · 34 left')).toBeVisible();
  await tile(page, 'F1-07').click();
  await expect(dialog(page).getByRole('button', { name: 'Cancel booking' })).toBeVisible();
  await expect(dialog(page)).not.toContainText('Note:');
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await bookWithNote(page, 'F1-04', 'Jamie Lee', 'need a second monitor');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
});

// B-7 (BA, 2026-10-23): without a note the confirmation showed a stray "null". Check that the note
// element is absent and that nothing renders "null" / "undefined" or loose text in the dialog —
// not just that the "Your note:" label is missing.
const looseText = (page) => dialog(page).evaluate((d) => [...d.childNodes]
  .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).map((n) => n.textContent));

async function expectNoNote(page) {
  await expect(dialog(page).locator('.note')).toHaveCount(0);
  await expect(dialog(page)).not.toContainText(/\bnull\b|\bundefined\b/);
  expect(await looseText(page)).toEqual([]);
}

test('B-7 — confirmation without a note has no note element and no "null"', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', '');
  await expect(dialog(page).getByRole('heading', { name: 'Booked ✓' })).toBeVisible();
  await expectNoNote(page);
});

test('B-7 — desk dialog of a booking made without a note has no note element and no "null"', async ({ page }) => {
  await onThursday(page);
  await bookWithNote(page, 'F1-04', 'Alex Morgan', '   ');
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await tile(page, 'F1-04').click();
  await expect(dialog(page).getByRole('button', { name: 'Cancel booking' })).toBeVisible();
  await expectNoNote(page);
});

test('B-7 — desk dialog of an old booking without the note field has no note element and no "null"', async ({ page }) => {
  await onThursday(page, [booking({ desk: 'F1-07' })]); // saved before notes existed — no `note` key
  await tile(page, 'F1-07').click();
  await expect(dialog(page).getByRole('button', { name: 'Cancel booking' })).toBeVisible();
  await expectNoNote(page);
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await namesSwitch(page).click(); // switch On must not change it either
  await tile(page, 'F1-07').click();
  await expectNoNote(page);
});
