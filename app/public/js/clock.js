// The one clock (NFR-010, DEC-016). The ?now= override works only on test hosts (config.md §4).
import { CLOCK_PARAM, TEST_HOSTS } from './config.js';
import { officeNow, officeToEpoch } from './time.js';

let delta = 0;

export function initClock({ host = '', search = '' } = {}) {
  delta = 0;
  if (!TEST_HOSTS.includes(host)) return;
  const target = officeToEpoch(new URLSearchParams(search).get(CLOCK_PARAM));
  if (target !== null) delta = target - Date.now();
}

/** Current office time { date, time }. */
export function now() {
  return officeNow(Date.now() + delta);
}
