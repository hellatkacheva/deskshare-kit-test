// The only storage module (data-model.md, storage.md §3). Every access is wrapped in try/catch.
import { FLOORS, RESET_PARAM, STORAGE_KEY, STORAGE_VERSION, TEST_HOSTS } from './config.js';
import { isBookable } from './rules.js';
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

/** storage.md §3.2 — counts per floor for one bookable date. */
export function readDay(date, now) {
  if (!isBookable(date, now)) return { ok: false, code: 'DATE_NOT_BOOKABLE' };
  const bookings = (read()?.bookings ?? []).filter((b) => b.date === date);
  const floors = FLOORS.map(({ id, desks }) => {
    const booked = bookings.filter((b) => b.floor === id).length;
    return { floor: id, booked, left: desks - booked, full: booked >= desks };
  });
  return { ok: true, floors };
}

export function storageState() {
  return state;
}
