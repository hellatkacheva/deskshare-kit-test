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
