import { describe, it, expect } from 'vitest';
import { FakeStorage } from './fake-storage.js';
import { open } from '../../public/js/storage.js';
import { STORAGE_KEY } from '../../public/js/config.js';

// US-014 — Names removed after the booking date (ASM-014, DEC-029)
const HOST = '127.0.0.1';
const b = (over) => ({
  date: '2026-10-21', desk: 'F1-07', floor: 1, name: 'Alex Morgan', nameKey: 'alex morgan', showName: false,
  bookedAt: '2026-10-20T16:00', deadline: '2026-10-21T10:00', checkedInAt: null, ...over,
});
const alex = b({ checkedInAt: '2026-10-21T09:05' });
const jamie = b({ desk: 'F2-03', floor: 2, name: 'Jamie Lee', nameKey: 'jamie lee', checkedInAt: '2026-10-21T09:20' });

function openOn(date, bookings) {
  const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }) });
  open({ date, time: '08:00' }, { storage: s, host: HOST });
  return JSON.parse(s.getItem(STORAGE_KEY));
}

describe('US-014 retention', () => {
  it('Names of past days are removed (state effect)', () => {
    const data = openOn('2026-10-22', [alex, jamie]);
    expect(data.bookings.filter((x) => x.date === '2026-10-21')).toEqual([]);
    expect(JSON.stringify(data)).not.toMatch(/Alex Morgan|Jamie Lee|alex morgan|jamie lee/);
    expect(data.pastCounts['2026-10-21']).toEqual({ 1: 1, 2: 1 });
  });

  it('Released bookings are not counted', () => {
    const sam = b({ desk: 'F1-09', name: 'Sam Rivera', nameKey: 'sam rivera' }); // not checked in → released at 10:00
    const data = openOn('2026-10-22', [alex, sam]);
    expect(data.pastCounts['2026-10-21']).toEqual({ 1: 1 });
  });

  it("Today's and future names are kept", () => {
    const thu = b({ date: '2026-10-22', deadline: '2026-10-22T10:00' });
    const data = openOn('2026-10-22', [thu]);
    expect(data.bookings).toEqual([thu]);
  });

  it('Removal also after days without use', () => {
    const thu = b({ date: '2026-10-22', deadline: '2026-10-22T10:00', checkedInAt: '2026-10-22T09:00' });
    const data = openOn('2026-10-26', [alex, thu]);
    expect(data.bookings.filter((x) => x.date < '2026-10-26')).toEqual([]);
    expect(data.pastCounts).toEqual({ '2026-10-21': { 1: 1 }, '2026-10-22': { 1: 1 } });
  });
});
