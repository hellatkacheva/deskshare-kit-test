// US-011 — Variant B: consent and names on the desk grid
import { test, expect } from '@playwright/test';
import {
  booking, day, dialog, doc, floorTab, namesSwitch, openApp, store, tile,
} from './helpers.js';

const THU = 'Thu 2026-10-22';
const CONSENT = 'Show my name to colleagues';
const NOTICE = 'Names are self-reported — not for emergency headcount.';

async function onThursday(page, bookings = [], switchOn = true) {
  await openApp(page, { at: '2026-10-21T16:00' });
  await store(page, doc(bookings));
  await day(page, THU).click();
  if (switchOn) await namesSwitch(page).click();
}

async function bookWithConsent(page, desk, name, consent) {
  await tile(page, desk).click();
  await page.getByLabel('Your name').fill(name);
  if (consent) await page.getByLabel(CONSENT).check();
  await page.getByRole('button', { name: 'Book desk' }).click();
  await dialog(page).getByRole('button', { name: 'Done' }).click();
}

test('Consent checkbox with the switch On', async ({ page }) => {
  await onThursday(page);
  await tile(page, 'F1-07').click();
  await expect(page.getByLabel(CONSENT)).toBeVisible();
  await expect(page.getByLabel(CONSENT)).not.toBeChecked();
});

test('Booking with consent shows the name (state effect)', async ({ page }) => {
  await onThursday(page);
  await bookWithConsent(page, 'F1-07', 'Alex Morgan', true);
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 Alex Morgan');
  await expect(tile(page, 'F1-07')).toContainText('Alex Morgan');
});

test('Booking without consent shows "taken"', async ({ page }) => {
  await onThursday(page);
  await bookWithConsent(page, 'F1-08', 'Jamie Lee', false);
  await expect(tile(page, 'F1-08')).toHaveAccessibleName('F1-08 taken');
  await expect(page.locator('#grid')).not.toContainText('Jamie Lee');
});

test('Switch Off hides names even with consent', async ({ page }) => {
  await onThursday(page, [booking({ showName: true })], false);
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 taken');
  await expect(page.locator('body')).not.toContainText('Alex Morgan');
});

test('No checkbox with the switch Off', async ({ page }) => {
  await onThursday(page, [], false);
  await floorTab(page, 2).click();
  await tile(page, 'F2-03').click();
  await expect(page.getByLabel(CONSENT)).toHaveCount(0);
  await page.getByLabel('Your name').fill('Sam Rivera');
  await page.getByRole('button', { name: 'Book desk' }).click();
  await dialog(page).getByRole('button', { name: 'Done' }).click();
  await namesSwitch(page).click();
  await expect(tile(page, 'F2-03')).toHaveAccessibleName('F2-03 taken');
});

test('Selected date only', async ({ page }) => {
  await onThursday(page, [booking({ showName: true }), booking({ date: '2026-10-23', showName: true })]);
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 Alex Morgan');
  await expect(page.locator('#grid').getByText('Alex Morgan')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /list|export|print/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /list|export|print/i })).toHaveCount(0);
});

test('No names on the counts view', async ({ page }) => {
  await onThursday(page, [booking({ showName: true })]);
  await expect(page.locator('#counts')).not.toContainText('Alex Morgan');
  await expect(page.locator('#floor-tabs')).not.toContainText('Alex Morgan');
});

test('Name shown as plain text', async ({ page }) => {
  await onThursday(page);
  await bookWithConsent(page, 'F1-10', '<b>Kim</b>', true);
  await expect(tile(page, 'F1-10')).toContainText('<b>Kim</b>');
  await expect(tile(page, 'F1-10').locator('b')).toHaveCount(0);
});

test('Notice wherever names are shown', async ({ page }) => {
  await onThursday(page, [booking({ showName: true })]);
  await expect(tile(page, 'F1-07')).toHaveAccessibleName('F1-07 Alex Morgan');
  await expect(page.locator('#book-view').getByText(NOTICE)).toBeVisible();
});
