// Seed for "now" (demo-data.md §1–3, DEC-017, DEC-032).
import { STORAGE_VERSION } from './config.js';
import { SEED_ROWS } from './seed-data.js';
import { cleanName, deadline, floorOf, isWorkingDay, nameKey, nextWorkingDay } from './rules.js';

export function buildSeed(now) {
  const workingDay = isWorkingDay(now.date);
  const d0 = workingDay ? now.date : nextWorkingDay(now.date);
  const d1 = nextWorkingDay(d0);
  const days = { D0: d0, D1: d1, D2: nextWorkingDay(d1) };
  const stamp = `${now.date}T${now.time}`;

  const bookings = SEED_ROWS.map((row) => {
    const date = days[row.day];
    return {
      date,
      desk: row.desk,
      floor: floorOf(row.desk),
      name: cleanName(row.name),
      nameKey: nameKey(row.name),
      showName: row.showName,
      bookedAt: stamp,
      deadline: deadline(date, now),
      // Weekend seed: no D0 booking is checked in (US-002 rule 6).
      checkedInAt: row.checkedIn && workingDay ? stamp : null,
    };
  });
  return { version: STORAGE_VERSION, seededAt: stamp, bookings, pastCounts: {} };
}
