import { describe, it, expect, afterEach, vi } from 'vitest';
import { initClock, now } from '../../public/js/clock.js';
import { officeNow } from '../../public/js/time.js';

// Real time Wed 2026-10-21 03:00 UTC = 08:00 office time (UTC+5)
const REAL = Date.UTC(2026, 9, 21, 3, 0);

describe('clock (NFR-010, config.md §4)', () => {
  afterEach(() => vi.useRealTimers());

  it('officeNow converts to office time, minute precision', () => {
    expect(officeNow(Date.UTC(2026, 9, 21, 20, 30, 59))).toEqual({ date: '2026-10-22', time: '01:30' });
  });

  it('?now= moves the clock on a test host, and time keeps running', () => {
    vi.useFakeTimers();
    vi.setSystemTime(REAL);
    initClock({ host: '127.0.0.1', search: '?now=2026-10-22T09:00' });
    expect(now()).toEqual({ date: '2026-10-22', time: '09:00' });
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(now()).toEqual({ date: '2026-10-22', time: '09:05' });
  });

  it('Test clock is ignored in the demo build (US-015)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(REAL);
    initClock({ host: 'hellatkacheva.github.io', search: '?now=2026-10-22T09:00' });
    expect(now()).toEqual({ date: '2026-10-21', time: '08:00' });
  });

  it('Malformed ?now= is ignored', () => {
    vi.useFakeTimers();
    vi.setSystemTime(REAL);
    initClock({ host: 'localhost', search: '?now=tomorrow' });
    expect(now()).toEqual({ date: '2026-10-21', time: '08:00' });
  });
});
