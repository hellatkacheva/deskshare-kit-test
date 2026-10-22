// Office time helpers (storage.md §2, I-2): fixed offset, minute precision, "YYYY-MM-DD" / "HH:MM".
import { OFFICE_UTC_OFFSET_MINUTES } from './config.js';

const MINUTE = 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

/** Epoch ms → office time { date, time }. */
export function officeNow(epochMs) {
  const d = new Date(epochMs + OFFICE_UTC_OFFSET_MINUTES * MINUTE);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

const dayUtc = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const isoDate = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** "YYYY-MM-DD" + n calendar days. */
export function addDays(date, n) {
  return isoDate(dayUtc(date) + n * 24 * 60 * MINUTE);
}

/** ISO weekday of a date: Mon = 1 … Sun = 7. */
export function isoWeekday(date) {
  return new Date(dayUtc(date)).getUTCDay() || 7;
}

/** Office time + n minutes, as "YYYY-MM-DDTHH:MM". */
export function addMinutes({ date, time }, n) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(dayUtc(date) + (h * 60 + m + n) * MINUTE);
  return `${isoDate(d.getTime())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Office time "YYYY-MM-DDTHH:MM" → epoch ms, or null if malformed. */
export function officeToEpoch(stamp) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(stamp ?? '');
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi);
  return Number.isNaN(utc) ? null : utc - OFFICE_UTC_OFFSET_MINUTES * MINUTE;
}
