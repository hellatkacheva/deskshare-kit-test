// Pure booking rules (storage.md §2).
import {
  AMBER_THRESHOLD_PERCENT, BOOKING_WINDOW_DAYS, CHECKIN_CUTOFF, DEADLINE_CAP, FLOORS, GRACE_MINUTES, NAME_MAX_LENGTH, NOTE_MAX_LENGTH, SAME_DAY_THRESHOLD,
  WORKING_DAYS,
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

/** Today if it is a working day, else the next working day (REQ-039, DEC-022). */
export function defaultDate(now) {
  return isWorkingDay(now.date) ? now.date : nextWorkingDay(now.date);
}

/** today ≤ date ≤ today + BOOKING_WINDOW_DAYS and a working day (ASM-010). */
export function isBookable(date, now) {
  return date >= now.date && date <= addDays(now.date, BOOKING_WINDOW_DAYS) && isWorkingDay(date);
}

/** The calendar days today … today + BOOKING_WINDOW_DAYS (I-13). */
export function windowDates(now) {
  return Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, i) => {
    const date = addDays(now.date, i);
    return { date, bookable: isWorkingDay(date) };
  });
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

/** Desk ids of a floor: F1-01 … F1-35 (ASM-007). */
export function desksOf(floorId) {
  const floor = FLOORS.find((f) => f.id === floorId);
  return floor ? Array.from({ length: floor.desks }, (_, i) => `${floor.prefix}-${pad(i + 1)}`) : [];
}

/** Floor id of a desk id, or null for an unknown desk. */
export function floorOf(desk) {
  const floor = FLOORS.find((f) => desksOf(f.id).includes(desk));
  return floor ? floor.id : null;
}

/** null when the name is fine, else NAME_REQUIRED / NAME_TOO_LONG (REQ-035, ASM-018, I-3). */
export function checkName(raw) {
  const name = cleanName(raw);
  if (!name) return 'NAME_REQUIRED';
  if ([...name].length > NAME_MAX_LENGTH) return 'NAME_TOO_LONG';
  return null;
}

/** Trimmed note, or null when there is none (REQ-046, US-018 rule 2). */
export function cleanNote(raw) {
  return String(raw ?? '').trim() || null;
}

/** null when the note is fine, else NOTE_TOO_LONG (REQ-047, code points after trim — US-018 rule 2, I-19). */
export function checkNote(raw) {
  const note = cleanNote(raw);
  return note && [...note].length > NOTE_MAX_LENGTH ? 'NOTE_TOO_LONG' : null;
}

/** Booking for today is closed from DEADLINE_CAP office time (DEC-024). */
export function sameDayClosed(date, now) {
  return date === now.date && now.time >= DEADLINE_CAP;
}

/** "Tomorrow" status (DEC-013): red when full, amber from AMBER_THRESHOLD_PERCENT, else green. */
export function floorStatus(booked, capacity) {
  if (booked >= capacity) return 'red';
  if (booked * 100 >= capacity * AMBER_THRESHOLD_PERCENT) return 'amber';
  return 'green';
}
