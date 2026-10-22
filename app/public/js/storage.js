// The only storage module (data-model.md, storage.md §3). Every access is wrapped in try/catch.
import { FLOORS, RESET_PARAM, STORAGE_KEY, STORAGE_VERSION, TEST_HOSTS } from './config.js';
import { MESSAGES } from './messages.js';
import {
  checkName, cleanName, deadline, desksOf, floorOf, isBookable, nameKey,
} from './rules.js';
import { buildSeed } from './seed.js';

const PROBE_KEY = `${STORAGE_KEY}:probe`;

let backend = null;
let state = 'unavailable'; // 'ready' | 'unavailable' | 'unreadable'

function usable(storage) {
  if (!storage) return false;
  try {
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Parsed document, or null when damaged / another version (DEC-031). */
function parse(raw) {
  try {
    const data = JSON.parse(raw);
    if (data && data.version === STORAGE_VERSION && Array.isArray(data.bookings)) return data;
  } catch {
    // damaged JSON
  }
  return null;
}

function write(data) {
  backend.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** storage.md §3.1 */
export function open(now, { storage, host = '', search = '' } = {}) {
  backend = null;
  state = 'unavailable';
  let seeded = false;
  let resetDone = false;
  const result = () => ({ state, seeded, resetDone });
  if (!usable(storage)) return result();
  backend = storage;
  try {
    // Team-only reset: local / test build only (REQ-044, DEC-031); never localStorage.clear() (I-11).
    if (TEST_HOSTS.includes(host) && new URLSearchParams(search).has(RESET_PARAM)) {
      backend.removeItem(STORAGE_KEY);
      resetDone = true;
    }
    const raw = backend.getItem(STORAGE_KEY);
    if (raw === null) {
      write(buildSeed(now));
      seeded = true;
      state = 'ready';
      return result();
    }
    state = parse(raw) ? 'ready' : 'unreadable';
  } catch {
    backend = null;
    state = 'unavailable';
  }
  return result();
}

/** Current document, re-read from storage on every call (another tab may have written). */
function read() {
  if (state !== 'ready') return null;
  try {
    return parse(backend.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** storage.md §3.2 — counts per floor and every desk for one bookable date. */
export function readDay(date, now, { names = false } = {}) {
  if (!isBookable(date, now)) return { ok: false, code: 'DATE_NOT_BOOKABLE' };
  const bookings = (read()?.bookings ?? []).filter((b) => b.date === date);
  const floors = FLOORS.map(({ id, desks }) => {
    const booked = bookings.filter((b) => b.floor === id).length;
    return { floor: id, booked, left: desks - booked, full: booked >= desks };
  });
  const byDesk = new Map(bookings.map((b) => [b.desk, b]));
  const desks = FLOORS.flatMap(({ id }) => desksOf(id).map((desk) => {
    const b = byDesk.get(desk);
    return {
      desk,
      floor: id,
      taken: Boolean(b),
      deadline: b ? b.deadline : null,
      checkedIn: Boolean(b?.checkedInAt),
      // Names only with the switch On and the booker's consent (REQ-026, REQ-028, ASM-015).
      name: b && names && b.showName ? b.name : null,
    };
  }));
  return { ok: true, floors, desks };
}

function fail(code, vars = {}) {
  const text = MESSAGES[code];
  return { ok: false, code, message: typeof text === 'function' ? text(vars) : text };
}

/**
 * read → check → write in one synchronous call (storage.md §3), so a stale tab cannot
 * double-book. `change(data)` returns a result; the document is written only on success.
 */
function mutate(change) {
  if (state === 'unavailable') return fail('STORAGE_OFF');
  if (state === 'unreadable') return fail('STORAGE_UNREADABLE');
  let data;
  try {
    data = parse(backend.getItem(STORAGE_KEY));
  } catch {
    return fail('STORAGE_OFF');
  }
  if (!data) return fail('STORAGE_UNREADABLE');
  const result = change(data);
  if (result.ok) {
    try {
      write(data);
    } catch {
      return fail('STORAGE_OFF');
    }
  }
  return result;
}

/** storage.md §3.3 */
export function book({ date, desk, name, showName = false }, now) {
  return mutate((data) => {
    const nameProblem = checkName(name);
    if (nameProblem) return fail(nameProblem);
    if (!isBookable(date, now)) return fail('DATE_NOT_BOOKABLE');
    const floor = floorOf(desk);
    if (floor === null) return fail('UNKNOWN_DESK');
    const sameDay = data.bookings.filter((b) => b.date === date);
    const capacity = FLOORS.find((f) => f.id === floor).desks;
    if (sameDay.filter((b) => b.floor === floor).length >= capacity) return fail('FLOOR_FULL');
    if (sameDay.some((b) => b.desk === desk)) return fail('DESK_TAKEN');
    const key = nameKey(name);
    if (sameDay.some((b) => b.nameKey === key)) return fail('NAME_ALREADY_BOOKED');
    const entry = {
      date,
      desk,
      floor,
      name: cleanName(name),
      nameKey: key,
      showName: Boolean(showName),
      bookedAt: `${now.date}T${now.time}`,
      deadline: deadline(date, now),
      checkedInAt: null,
    };
    data.bookings.push(entry);
    return { ok: true, booking: { date, desk, deadline: entry.deadline } };
  });
}

export function storageState() {
  return state;
}
