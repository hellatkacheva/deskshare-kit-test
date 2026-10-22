// The only storage module (data-model.md, storage.md §3). Every access is wrapped in try/catch.
import { STORAGE_KEY, STORAGE_VERSION } from './config.js';

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

function emptyDoc() {
  return { version: STORAGE_VERSION, seededAt: null, bookings: [], pastCounts: {} };
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
  const result = () => ({ state, seeded: false, resetDone: false });
  if (!usable(storage)) return result();
  backend = storage;
  try {
    const raw = backend.getItem(STORAGE_KEY);
    if (raw === null) {
      write(emptyDoc());
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

export function storageState() {
  return state;
}
