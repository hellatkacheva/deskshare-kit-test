// Pure booking rules (storage.md §2).
import {
  CHECKIN_CUTOFF, DEADLINE_CAP, FLOORS, GRACE_MINUTES, SAME_DAY_THRESHOLD, WORKING_DAYS,
} from './config.js';
import { addDays, addMinutes, isoWeekday } from './time.js';

const pad = (n) => String(n).padStart(2, '0');

export function isWorkingDay(date) {
  return WORKING_DAYS.includes(isoWeekday(date));
}

/** First working day after `date` (Fri / Sat / Sun → Mon). */
export function nextWorkingDay(date) {
  let d = addDays(date, 1);
  while (!isWorkingDay(d)) d = addDays(d, 1);
  return d;
}

/** Check-in deadline of a booking for `date` made at `now` (ASM-008, DEC-024). */
export function deadline(date, now) {
  if (now.date < date || now.time <= SAME_DAY_THRESHOLD) return `${date}T${CHECKIN_CUTOFF}`;
  const graced = addMinutes(now, GRACE_MINUTES);
  const cap = `${date}T${DEADLINE_CAP}`;
  return graced < cap ? graced : cap;
}

/** Trimmed name as stored (I-3). */
export function cleanName(raw) {
  return String(raw ?? '').trim();
}

/** Name for comparison: NFC, trimmed, single spaces, lower case (REQ-035, I-3). */
export function nameKey(raw) {
  return cleanName(String(raw ?? '').normalize('NFC')).replace(/\s+/g, ' ').toLowerCase();
}

/** Desk ids of a floor: F1-01 … F1-30 (ASM-007). */
export function desksOf(floorId) {
  const floor = FLOORS.find((f) => f.id === floorId);
  return floor ? Array.from({ length: floor.desks }, (_, i) => `${floor.prefix}-${pad(i + 1)}`) : [];
}

/** Floor id of a desk id, or null for an unknown desk. */
export function floorOf(desk) {
  const floor = FLOORS.find((f) => desksOf(f.id).includes(desk));
  return floor ? floor.id : null;
}
