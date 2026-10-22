import { describe, it, expect } from 'vitest';
import {
  checkName, deadline, defaultDate, isBookable, isWorkingDay, nameKey, nextWorkingDay, windowDates,
} from '../../public/js/rules.js';
import { formatDate } from '../../public/js/time.js';

const at = (date, time) => ({ date, time });

describe('working days (ASM-010, DEC-013)', () => {
  it('weekdays are working days, weekends are not', () => {
    expect(isWorkingDay('2026-10-23')).toBe(true); // Fri
    expect(isWorkingDay('2026-10-24')).toBe(false); // Sat
    expect(isWorkingDay('2026-10-25')).toBe(false); // Sun
  });

  it('next working day: Wed → Thu, Fri / Sat / Sun → Mon', () => {
    expect(nextWorkingDay('2026-10-21')).toBe('2026-10-22');
    expect(nextWorkingDay('2026-10-23')).toBe('2026-10-26');
    expect(nextWorkingDay('2026-10-24')).toBe('2026-10-26');
    expect(nextWorkingDay('2026-10-25')).toBe('2026-10-26');
    expect(nextWorkingDay('2026-10-30')).toBe('2026-11-02');
  });
});

describe('deadline (US-017 rules 1–2, used by the seed)', () => {
  it('booked before the day → 10:00', () => {
    expect(deadline('2026-10-22', at('2026-10-21', '16:00'))).toBe('2026-10-22T10:00');
  });
  it('same day at 09:30 → 10:00; 09:31 → 10:01', () => {
    expect(deadline('2026-10-21', at('2026-10-21', '09:30'))).toBe('2026-10-21T10:00');
    expect(deadline('2026-10-21', at('2026-10-21', '09:31'))).toBe('2026-10-21T10:01');
  });
  it('same day late → capped at 23:59', () => {
    expect(deadline('2026-10-21', at('2026-10-21', '23:45'))).toBe('2026-10-21T23:59');
  });
});

describe('nameKey (REQ-035, I-3)', () => {
  it('case-insensitive, ignores leading, trailing and repeated spaces', () => {
    expect(nameKey('  alex   MORGAN ')).toBe('alex morgan');
  });
});

describe('US-003 booking window and default date (ASM-010, DEC-022)', () => {
  const NOW = { date: '2026-10-21', time: '08:00' };

  it('Booking window — last day and day after', () => {
    const dates = windowDates(NOW);
    expect(dates.map((d) => d.date)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24',
      '2026-10-25', '2026-10-26', '2026-10-27']);
    expect(isBookable('2026-10-27', NOW)).toBe(true);
    expect(isBookable('2026-10-28', NOW)).toBe(false);
  });

  it('Weekends and past dates cannot be chosen', () => {
    const byDate = Object.fromEntries(windowDates(NOW).map((d) => [d.date, d.bookable]));
    expect(byDate['2026-10-24']).toBe(false);
    expect(byDate['2026-10-25']).toBe(false);
    expect(isBookable('2026-10-20', NOW)).toBe(false);
  });

  it('Default date on a weekday', () => {
    expect(defaultDate(NOW)).toBe('2026-10-21');
  });

  it('Default date on a weekend', () => {
    expect(defaultDate({ date: '2026-10-24', time: '12:00' })).toBe('2026-10-26');
    expect(defaultDate({ date: '2026-10-25', time: '12:00' })).toBe('2026-10-26');
  });
});

describe('formatDate', () => {
  it('Thu 2026-10-22', () => {
    expect(formatDate('2026-10-22')).toBe('Thu 2026-10-22');
  });
});

describe('US-016 checkName (REQ-035, ASM-018)', () => {
  it('Name of spaces only / empty → NAME_REQUIRED', () => {
    expect(checkName('   ')).toBe('NAME_REQUIRED');
    expect(checkName('')).toBe('NAME_REQUIRED');
  });
  it('50 characters ok, 51 → NAME_TOO_LONG (code points after trim)', () => {
    expect(checkName('a'.repeat(50))).toBeNull();
    expect(checkName(` ${'a'.repeat(50)} `)).toBeNull();
    expect(checkName('a'.repeat(51))).toBe('NAME_TOO_LONG');
    expect(checkName('😀'.repeat(50))).toBeNull();
  });
});
