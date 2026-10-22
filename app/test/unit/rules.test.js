import { describe, it, expect } from 'vitest';
import { deadline, isWorkingDay, nameKey, nextWorkingDay } from '../../public/js/rules.js';

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
