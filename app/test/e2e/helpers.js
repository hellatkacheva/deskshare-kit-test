// Shared E2E helpers (test-plan.md §1). Test data is written straight into localStorage —
// there is no test-only code path in the app.
export const KEY = 'deskshare-kit:v1';
export const BANNER = 'Demo — bookings are stored in this browser only.';

/** Office time "YYYY-MM-DDTHH:MM" (UTC+5) → Date. */
export function office(stamp) {
  return new Date(`${stamp}:00+05:00`);
}

export async function openApp(page, { at = '2026-10-21T08:00', path = '/' } = {}) {
  await page.clock.install({ time: office(at) });
  await page.goto(path);
}

export function booking(over = {}) {
  return {
    date: '2026-10-22', desk: 'F1-07', floor: 1, name: 'Alex Morgan', nameKey: 'alex morgan',
    showName: false, bookedAt: '2026-10-21T16:00', deadline: '2026-10-22T10:00', checkedInAt: null,
    ...over,
  };
}

export function doc(bookings = [], over = {}) {
  return { version: 1, seededAt: null, bookings, pastCounts: {}, ...over };
}

/** Replace the stored document (raw string or object) and reload the page. */
export async function store(page, value) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, raw]);
  await page.reload();
}

export async function stored(page) {
  return page.evaluate((k) => localStorage.getItem(k), KEY);
}

/** n bookings on one floor for one date, desks 01…n, unique fictional names. */
export function many(date, floor, n, over = {}, from = 1) {
  return Array.from({ length: n }, (_, i) => {
    const desk = `F${floor}-${String(from + i).padStart(2, "0")}`;
    return booking({ date, desk, floor, name: `Person ${desk}`, nameKey: `person ${desk.toLowerCase()}`, ...over });
  });
}

/** Date button in the strip, by its accessible name "Thu 2026-10-22". */
export const day = (page, label) => page.getByRole('button', { name: label, exact: true });
export const floorTab = (page, n) => page.getByRole('button', { name: new RegExp(`^Floor ${n} ·`) });

/** Desk tile on the grid, by its accessible name "F1-07 free" / "F1-07 taken" / "F1-07 <name>". */
export const tile = (page, desk) => page.getByRole('button', { name: new RegExp(`^${desk} `) });

export const dialog = (page) => page.locator('dialog[open]');

/** Open the booking form of a free desk on the selected date / floor, type a name, press Book desk. */
export async function bookDesk(page, desk, name) {
  await tile(page, desk).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Book desk' }).click();
}

/** Open the desk actions of a taken desk, type a name, press Cancel booking. */
export async function cancelDesk(page, desk, name) {
  await tile(page, desk).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Cancel booking' }).click();
}

/** Open the desk actions of a taken desk, type a name, press Check in. */
export async function checkInDesk(page, desk, name) {
  await tile(page, desk).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Check in' }).click();
}

export const namesSwitch = (page) => page.getByRole('switch', { name: "Show colleagues' names" });
