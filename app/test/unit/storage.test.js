import { describe, it, expect } from 'vitest';
import { FakeStorage } from './fake-storage.js';
import {
  book, cancel, checkIn, open, readDay, sweep, tomorrow,
} from '../../public/js/storage.js';
import { STORAGE_KEY } from '../../public/js/config.js';

const NOW = { date: '2026-10-21', time: '08:00' };
const HOST = '127.0.0.1';

const booking = {
  date: '2026-10-22', desk: 'F1-07', floor: 1, name: 'Alex Morgan', nameKey: 'alex morgan',
  showName: false, bookedAt: '2026-10-21T16:00', deadline: '2026-10-22T10:00', checkedInAt: null,
};

describe('US-001 storage states', () => {
  it('Storage not available — no storage object', () => {
    expect(open(NOW, { storage: null, host: HOST, search: '' }).state).toBe('unavailable');
  });

  it('Storage not available — every access throws', () => {
    const s = new FakeStorage();
    s.blocked = true;
    expect(open(NOW, { storage: s, host: HOST, search: '' }).state).toBe('unavailable');
  });

  it('Empty storage becomes a version-1 document', () => {
    const s = new FakeStorage();
    expect(open(NOW, { storage: s, host: HOST, search: '' }).state).toBe('ready');
    expect(JSON.parse(s.getItem(STORAGE_KEY)).version).toBe(1);
  });

  it('Existing data is read and kept', () => {
    const raw = JSON.stringify({ version: 1, seededAt: null, bookings: [booking], pastCounts: {} });
    const s = new FakeStorage({ [STORAGE_KEY]: raw });
    expect(open(NOW, { storage: s, host: HOST, search: '' }).state).toBe('ready');
    expect(JSON.parse(s.getItem(STORAGE_KEY)).bookings).toEqual([booking]);
  });

  it('Saved data cannot be read — damaged JSON is left unchanged (DEC-031)', () => {
    const raw = '{"version":1,"bookings":[';
    const s = new FakeStorage({ [STORAGE_KEY]: raw });
    expect(open(NOW, { storage: s, host: HOST, search: '' }).state).toBe('unreadable');
    expect(s.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('Saved data cannot be read — other storage version is left unchanged (DEC-031)', () => {
    const raw = JSON.stringify({ version: 2, bookings: [] });
    const s = new FakeStorage({ [STORAGE_KEY]: raw });
    expect(open(NOW, { storage: s, host: HOST, search: '' }).state).toBe('unreadable');
    expect(s.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('Unreadable data stays unreadable without the reset parameter', () => {
    const s = new FakeStorage({ [STORAGE_KEY]: '{broken' });
    expect(open(NOW, { storage: s, host: 'hellatkacheva.github.io', search: '?reset-demo' }).state).toBe('unreadable');
    expect(s.getItem(STORAGE_KEY)).toBe('{broken');
  });

  it('Only the app key is written (probe key removed, I-11)', () => {
    const s = new FakeStorage({ 'other-app:v1': 'x' });
    open(NOW, { storage: s, host: HOST, search: '' });
    expect([...s.map.keys()].sort()).toEqual([STORAGE_KEY, 'other-app:v1'].sort());
  });
});

describe('US-002 seed and reset (storage.md §3.1)', () => {
  const docOf = (s) => JSON.parse(s.getItem(STORAGE_KEY));
  const withAlex = () => JSON.stringify({ version: 1, seededAt: null, bookings: [booking], pastCounts: {} });

  it('First open loads the seed', () => {
    const s = new FakeStorage();
    const r = open(NOW, { storage: s, host: HOST, search: '' });
    expect(r.seeded).toBe(true);
    expect(docOf(s).bookings).toHaveLength(86);
    expect(docOf(s).seededAt).toBe('2026-10-21T08:00');
  });

  it('Seed does not overwrite existing data', () => {
    const raw = withAlex();
    const s = new FakeStorage({ [STORAGE_KEY]: raw });
    const r = open(NOW, { storage: s, host: HOST, search: '' });
    expect(r.seeded).toBe(false);
    expect(s.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('Team-only reset in the local / test build (state effect)', () => {
    const s = new FakeStorage({ [STORAGE_KEY]: withAlex() });
    const r = open(NOW, { storage: s, host: '127.0.0.1', search: '?reset-demo' });
    expect(r.resetDone).toBe(true);
    expect(r.seeded).toBe(true);
    expect(docOf(s).bookings.some((b) => b.name === 'Alex Morgan')).toBe(false);
    expect(docOf(s).bookings).toHaveLength(86);
  });

  it('Reset also works on localhost and repairs unreadable data', () => {
    const s = new FakeStorage({ [STORAGE_KEY]: '{broken' });
    expect(open(NOW, { storage: s, host: 'localhost', search: '?reset-demo' }).state).toBe('ready');
    expect(docOf(s).bookings).toHaveLength(86);
  });

  it('Reset parameter ignored in the deployed build (DEC-031)', () => {
    const raw = withAlex();
    const s = new FakeStorage({ [STORAGE_KEY]: raw });
    const r = open(NOW, { storage: s, host: 'hellatkacheva.github.io', search: '?reset-demo' });
    expect(r.resetDone).toBe(false);
    expect(s.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('Reset leaves other apps\' keys alone (I-11)', () => {
    const s = new FakeStorage({ [STORAGE_KEY]: withAlex(), 'gearloan:v1': 'keep' });
    open(NOW, { storage: s, host: HOST, search: '?reset-demo' });
    expect(s.getItem('gearloan:v1')).toBe('keep');
  });
});

describe('US-003 readDay counts (storage.md §3.2)', () => {
  const desk = (floor, n) => `F${floor}-${String(n).padStart(2, '0')}`;
  const many = (date, floor, n) => Array.from({ length: n }, (_, i) => ({
    ...booking, date, desk: desk(floor, i + 1), floor, name: `P${floor}-${i}`, nameKey: `p${floor}-${i}`,
  }));
  const withDoc = (bookings) => new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }),
  });

  it('See booked and remaining desks for a date', () => {
    open(NOW, { storage: withDoc([...many('2026-10-22', 1, 12), ...many('2026-10-22', 2, 25)]), host: HOST });
    const r = readDay('2026-10-22', NOW);
    expect(r.ok).toBe(true);
    expect(r.floors).toEqual([
      { floor: 1, booked: 12, left: 18, full: false },
      { floor: 2, booked: 25, left: 0, full: true },
    ]);
  });

  it('Date without bookings (empty state)', () => {
    open(NOW, { storage: withDoc(many('2026-10-22', 1, 3)), host: HOST });
    expect(readDay('2026-10-23', NOW).floors.map((f) => [f.booked, f.left])).toEqual([[0, 30], [0, 25]]);
  });

  it('re-reads storage on every call (another tab may have written)', () => {
    const s = withDoc([]);
    open(NOW, { storage: s, host: HOST });
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, seededAt: null, bookings: many('2026-10-22', 1, 2), pastCounts: {} }));
    expect(readDay('2026-10-22', NOW).floors[0].booked).toBe(2);
  });

  it('a date outside the window is not read', () => {
    open(NOW, { storage: withDoc([]), host: HOST });
    expect(readDay('2026-10-20', NOW)).toMatchObject({ ok: false, code: 'DATE_NOT_BOOKABLE' });
  });

  it('storage unavailable → empty floors (I-18)', () => {
    open(NOW, { storage: null, host: HOST });
    expect(readDay('2026-10-22', NOW).floors.map((f) => f.booked)).toEqual([0, 0]);
  });
});

describe('US-004 readDay desks (storage.md §3.2)', () => {
  const withDoc = (bookings) => new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }),
  });

  it('every desk of both floors, free or taken', () => {
    open(NOW, { storage: withDoc([booking]), host: HOST });
    const { desks } = readDay('2026-10-22', NOW);
    expect(desks).toHaveLength(55);
    expect(desks.filter((d) => d.floor === 2).map((d) => d.desk)[24]).toBe('F2-25');
    expect(desks.find((d) => d.desk === 'F1-07')).toMatchObject({ taken: true, deadline: '2026-10-22T10:00', checkedIn: false });
    expect(desks.find((d) => d.desk === 'F1-08')).toMatchObject({ taken: false, deadline: null, name: null });
  });

  it('Taken desk without a name (Variant A) — names off', () => {
    open(NOW, { storage: withDoc([{ ...booking, showName: true }]), host: HOST });
    expect(readDay('2026-10-22', NOW).desks.find((d) => d.desk === 'F1-07').name).toBeNull();
    expect(readDay('2026-10-22', NOW, { names: false }).desks.find((d) => d.desk === 'F1-07').name).toBeNull();
  });

  it('Grid follows the date', () => {
    open(NOW, { storage: withDoc([booking]), host: HOST });
    expect(readDay('2026-10-23', NOW).desks.find((d) => d.desk === 'F1-07').taken).toBe(false);
  });
});

describe('US-005 book (storage.md §3.3)', () => {
  const THU = '2026-10-22';
  const at = (date, time) => ({ date, time });
  const start = (bookings = []) => {
    const s = new FakeStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }),
    });
    open(NOW, { storage: s, host: HOST });
    return s;
  };
  const stored = (s) => JSON.parse(s.getItem(STORAGE_KEY)).bookings;

  it('Book a free desk — confirmed at once, state effect', () => {
    const s = start();
    const r = book({ date: THU, desk: 'F1-07', name: 'Alex Morgan' }, at('2026-10-21', '16:00'));
    expect(r).toEqual({ ok: true, booking: { date: THU, desk: 'F1-07', deadline: '2026-10-22T10:00' } });
    expect(stored(s)).toEqual([{
      date: THU, desk: 'F1-07', floor: 1, name: 'Alex Morgan', nameKey: 'alex morgan', showName: false,
      bookedAt: '2026-10-21T16:00', deadline: '2026-10-22T10:00', checkedInAt: null,
    }]);
    expect(readDay(THU, NOW).floors[0]).toMatchObject({ booked: 1, left: 29 });
  });

  it('Taken desk cannot be booked', () => {
    const s = start([booking]);
    expect(book({ date: THU, desk: 'F1-07', name: 'Jamie Lee' }, NOW))
      .toMatchObject({ ok: false, code: 'DESK_TAKEN', message: 'This desk is already taken — pick another desk.' });
    expect(stored(s)).toEqual([booking]);
  });

  it('Same desk on another date is free', () => {
    start([booking]);
    expect(book({ date: '2026-10-23', desk: 'F1-07', name: 'Jamie Lee' }, NOW).ok).toBe(true);
  });

  it('Second booking under the same name on the same day', () => {
    const s = start([booking]);
    expect(book({ date: THU, desk: 'F2-03', name: 'Alex Morgan' }, NOW))
      .toMatchObject({ ok: false, code: 'NAME_ALREADY_BOOKED', message: 'This name already has a booking for that day.' });
    expect(stored(s)).toHaveLength(1);
  });

  it('Same name with different case and spaces', () => {
    start([booking]);
    expect(book({ date: THU, desk: 'F2-03', name: ' alex  morgan ' }, NOW).code).toBe('NAME_ALREADY_BOOKED');
  });

  it('Same name on another day', () => {
    start([booking]);
    expect(book({ date: '2026-10-23', desk: 'F1-07', name: 'Alex Morgan' }, NOW).ok).toBe(true);
  });

  it('Two tabs — stale tab cannot double-book (re-check at save)', () => {
    const s = start();
    expect(book({ date: THU, desk: 'F1-07', name: 'Alex Morgan' }, NOW).ok).toBe(true); // tab 1
    expect(book({ date: THU, desk: 'F1-07', name: 'Jamie Lee' }, NOW).code).toBe('DESK_TAKEN'); // tab 2
    expect(stored(s)).toHaveLength(1);
  });

  it('Date outside the window refused at save', () => {
    const s = start();
    expect(book({ date: '2026-10-20', desk: 'F1-07', name: 'Alex Morgan' }, at('2026-10-21', '00:05')))
      .toMatchObject({ ok: false, code: 'DATE_NOT_BOOKABLE' });
    expect(stored(s)).toHaveLength(0);
  });

  it('stored name is trimmed (I-3); unknown desk refused', () => {
    const s = start();
    book({ date: THU, desk: 'F1-07', name: '  Alex Morgan ' }, NOW);
    expect(stored(s)[0].name).toBe('Alex Morgan');
    expect(book({ date: THU, desk: 'F9-01', name: 'Jamie Lee' }, NOW).code).toBe('UNKNOWN_DESK');
  });

  it('no storage → STORAGE_OFF; unreadable → STORAGE_UNREADABLE', () => {
    open(NOW, { storage: null, host: HOST });
    expect(book({ date: THU, desk: 'F1-07', name: 'A' }, NOW).code).toBe('STORAGE_OFF');
    open(NOW, { storage: new FakeStorage({ [STORAGE_KEY]: '{x' }), host: HOST });
    expect(book({ date: THU, desk: 'F1-07', name: 'A' }, NOW).code).toBe('STORAGE_UNREADABLE');
  });
});

describe('US-016 name rules in book()', () => {
  const start = () => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings: [], pastCounts: {} }) });
    open(NOW, { storage: s, host: HOST });
    return s;
  };
  it('Name of spaces only', () => {
    const s = start();
    expect(book({ date: '2026-10-22', desk: 'F1-07', name: '   ' }, NOW))
      .toMatchObject({ ok: false, code: 'NAME_REQUIRED', message: 'Please enter your name.' });
    expect(JSON.parse(s.getItem(STORAGE_KEY)).bookings).toEqual([]);
  });
  it('Name of exactly 50 characters (boundary)', () => {
    start();
    expect(book({ date: '2026-10-22', desk: 'F1-07', name: 'a'.repeat(50) }, NOW).ok).toBe(true);
  });
  it('Name of 51 characters (boundary + 1)', () => {
    start();
    expect(book({ date: '2026-10-22', desk: 'F1-08', name: 'a'.repeat(51) }, NOW))
      .toMatchObject({ ok: false, code: 'NAME_TOO_LONG', message: 'Name is too long — maximum 50 characters.' });
  });
});

describe('US-006 hard stop', () => {
  const desk2 = (n) => `F2-${String(n).padStart(2, '0')}`;
  const floor2 = (n) => Array.from({ length: n }, (_, i) => ({
    ...booking, desk: desk2(i + 1), floor: 2, name: `P${i}`, nameKey: `p${i}`,
  }));
  const start = (bookings) => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }) });
    open(NOW, { storage: s, host: HOST });
    return s;
  };

  it('Last free desk can be booked (capacity − 1)', () => {
    start(floor2(24));
    expect(book({ date: '2026-10-22', desk: 'F2-25', name: 'Jamie Lee' }, NOW).ok).toBe(true);
    expect(readDay('2026-10-22', NOW).floors[1]).toEqual({ floor: 2, booked: 25, left: 0, full: true });
  });

  it('Last desk taken in another tab → FLOOR_FULL, not DESK_TAKEN', () => {
    start(floor2(24));
    expect(book({ date: '2026-10-22', desk: 'F2-25', name: 'Jamie Lee' }, NOW).ok).toBe(true);
    expect(book({ date: '2026-10-22', desk: 'F2-25', name: 'Sam Rivera' }, NOW)).toMatchObject({
      ok: false, code: 'FLOOR_FULL', message: 'This floor is full for this day — please pick another day or floor.',
    });
  });
});

describe('US-007 cancel (storage.md §3.4)', () => {
  const THU = '2026-10-22';
  const start = (bookings) => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }) });
    open(NOW, { storage: s, host: HOST });
    return s;
  };
  const stored = (s) => JSON.parse(s.getItem(STORAGE_KEY)).bookings;

  it('Booking already cancelled in another tab', () => {
    const s = start([booking]);
    expect(cancel({ date: THU, desk: 'F1-07', name: 'Alex Morgan' }, NOW).ok).toBe(true);
    expect(cancel({ date: THU, desk: 'F1-07', name: 'Alex Morgan' }, NOW)).toMatchObject({
      ok: false, code: 'NO_BOOKING', message: 'There is no booking for F1-07 on Thu 2026-10-22.',
    });
    expect(stored(s)).toEqual([]);
  });

  it('Name match ignores case and extra spaces', () => {
    start([booking]);
    expect(cancel({ date: THU, desk: 'F1-07', name: '  alex   MORGAN ' }, NOW).ok).toBe(true);
  });

  it('Wrong name', () => {
    const s = start([booking]);
    expect(cancel({ date: THU, desk: 'F1-07', name: 'Alex Morgen' }, NOW)).toMatchObject({
      ok: false, code: 'NAME_MISMATCH', message: 'The name does not match the booking.',
    });
    expect(stored(s)).toEqual([booking]);
  });

  it('Cancel after check-in on the booking day', () => {
    const s = start([{ ...booking, checkedInAt: '2026-10-22T09:10' }]);
    expect(cancel({ date: THU, desk: 'F1-07', name: 'Alex Morgan' }, { date: THU, time: '15:00' }).ok).toBe(true);
    expect(stored(s)).toEqual([]);
  });

  it('Same name can book again after cancel', () => {
    start([booking]);
    cancel({ date: THU, desk: 'F1-07', name: 'Alex Morgan' }, NOW);
    expect(book({ date: THU, desk: 'F1-09', name: 'Alex Morgan' }, NOW).ok).toBe(true);
  });
});

describe('US-017 same-day closing in book()', () => {
  const start = () => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings: [], pastCounts: {} }) });
    open(NOW, { storage: s, host: HOST });
    return s;
  };
  it('Same-day booking at 23:58 (boundary) — confirmed with deadline 23:59', () => {
    start();
    expect(book({ date: '2026-10-21', desk: 'F2-03', name: 'Jamie Lee' }, { date: '2026-10-21', time: '23:58' }))
      .toMatchObject({ ok: true, booking: { deadline: '2026-10-21T23:59' } });
  });
  it('Same-day booking at 23:59 is refused (boundary)', () => {
    const late = { date: '2026-10-21', time: '23:59' };
    start();
    expect(book({ date: '2026-10-21', desk: 'F2-03', name: 'Jamie Lee' }, late)).toMatchObject({
      ok: false, code: 'SAME_DAY_CLOSED', message: 'Booking for today is closed — please pick another date',
    });
    expect(book({ date: '2026-10-22', desk: 'F2-03', name: 'Jamie Lee' }, late).ok).toBe(true);
  });
});

describe('US-008 checkIn (storage.md §3.5)', () => {
  const THU = '2026-10-22';
  const at = (time) => ({ date: THU, time });
  const start = (bookings = [booking]) => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }) });
    open(NOW, { storage: s, host: HOST });
    return s;
  };
  const stored = (s) => JSON.parse(s.getItem(STORAGE_KEY)).bookings;
  const alex = (name = 'Alex Morgan') => ({ date: THU, desk: 'F1-07', name });

  it('Check in before the deadline — state effect', () => {
    const s = start();
    expect(checkIn(alex(), at('09:10'))).toEqual({ ok: true });
    expect(stored(s)[0].checkedInAt).toBe('2026-10-22T09:10');
  });

  it('Check-in before the booking day is refused', () => {
    start();
    expect(checkIn(alex(), { date: '2026-10-21', time: '16:00' })).toMatchObject({
      ok: false, code: 'NOT_BOOKING_DAY', message: 'Check-in is only possible on the booking day.',
    });
  });

  it('Wrong name', () => {
    const s = start();
    expect(checkIn(alex('Jamie Lee'), at('09:10')).code).toBe('NAME_MISMATCH');
    expect(stored(s)[0].checkedInAt).toBeNull();
  });

  it('Name match ignores case and extra spaces', () => {
    start();
    expect(checkIn(alex('  ALEX   morgan'), at('09:10')).ok).toBe(true);
  });

  it('One minute before the deadline (boundary)', () => {
    start();
    expect(checkIn(alex(), at('09:59')).ok).toBe(true);
  });

  it('Exactly at the deadline is too late (boundary)', () => {
    start();
    expect(checkIn(alex(), at('10:00'))).toMatchObject({
      ok: false, code: 'RELEASED', message: 'Too late — the booking was released at 10:00 office time (UTC+5).',
    });
  });

  it('Second check-in', () => {
    const s = start();
    checkIn(alex(), at('09:10'));
    expect(checkIn(alex(), at('09:20'))).toEqual({
      ok: true, info: 'ALREADY_CHECKED_IN', message: 'This booking is already checked in.',
    });
    expect(stored(s)[0].checkedInAt).toBe('2026-10-22T09:10');
  });

  it('No booking on the desk', () => {
    start([]);
    expect(checkIn(alex(), at('09:10')).code).toBe('NO_BOOKING');
  });
});

describe('US-009 auto-release (storage.md §3.7)', () => {
  const THU = '2026-10-22';
  const at = (time, date = THU) => ({ date, time });
  const jamie = { ...booking, desk: 'F2-03', floor: 2, name: 'Jamie Lee', nameKey: 'jamie lee' }; // deadline 10:00
  const start = (bookings) => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }) });
    open(at('09:00'), { storage: s, host: HOST });
    return s;
  };
  const f2 = (r) => r.floors[1];
  const deskOf = (r, d) => r.desks.find((x) => x.desk === d);

  it('Booking released after the deadline (state effect)', () => {
    const s = start([jamie]);
    const r = readDay(THU, at('10:01'));
    expect(deskOf(r, 'F2-03').taken).toBe(false);
    expect(f2(r)).toMatchObject({ booked: 0, left: 25 });
    expect(JSON.parse(s.getItem(STORAGE_KEY)).bookings).toEqual([]); // released = deleted, saved
  });

  it('Released exactly at the deadline (boundary)', () => {
    start([jamie]);
    expect(deskOf(readDay(THU, at('10:00')), 'F2-03').taken).toBe(false);
  });

  it('Not released before the deadline', () => {
    start([jamie]);
    expect(deskOf(readDay(THU, at('09:59')), 'F2-03').taken).toBe(true);
  });

  it('Released without anyone using the app at 10:00 (open at 11:00)', () => {
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings: [jamie], pastCounts: {} }) });
    open(at('11:00'), { storage: s, host: HOST });
    expect(JSON.parse(s.getItem(STORAGE_KEY)).bookings).toEqual([]);
  });

  it('Checked-in booking is not released', () => {
    start([{ ...booking, checkedInAt: '2026-10-22T09:10' }]);
    expect(deskOf(readDay(THU, at('10:01')), 'F1-07').taken).toBe(true);
  });

  it('Released desk can be booked again', () => {
    start([jamie]);
    expect(book({ date: THU, desk: 'F2-03', name: 'Sam Rivera' }, at('10:05')))
      .toMatchObject({ ok: true, booking: { deadline: '2026-10-22T10:35' } });
  });

  it('Same name can book again after release', () => {
    start([jamie]);
    expect(book({ date: THU, desk: 'F2-05', name: 'Jamie Lee' }, at('10:10')).ok).toBe(true);
  });

  it('Late same-day booking released at 23:59', () => {
    const late = { ...jamie, date: '2026-10-21', bookedAt: '2026-10-21T23:45', deadline: '2026-10-21T23:59' };
    start([late]);
    expect(deskOf(readDay('2026-10-21', at('23:59', '2026-10-21')), 'F2-03').taken).toBe(false);
  });

  it('sweep() reports changes and keeps checked-in bookings', () => {
    const data = { version: 1, bookings: [jamie, { ...booking, checkedInAt: '2026-10-22T09:00' }], pastCounts: {} };
    const r = sweep(data, at('10:00'));
    expect(r.changed).toBe(true);
    expect(r.data.bookings.map((b) => b.desk)).toEqual(['F1-07']);
    expect(sweep(r.data, at('10:00')).changed).toBe(false);
  });
});

describe('US-010 / US-011 names in readDay', () => {
  const withDoc = (bookings) => new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings, pastCounts: {} }),
  });
  it('switch On: name only with consent; switch Off: never', () => {
    const jamie = { ...booking, desk: 'F1-08', name: 'Jamie Lee', nameKey: 'jamie lee', showName: false };
    open(NOW, { storage: withDoc([{ ...booking, showName: true }, jamie]), host: HOST });
    const on = readDay('2026-10-22', NOW, { names: true }).desks;
    expect(on.find((d) => d.desk === 'F1-07').name).toBe('Alex Morgan');
    expect(on.find((d) => d.desk === 'F1-08').name).toBeNull();
    expect(readDay('2026-10-22', NOW, { names: false }).desks.find((d) => d.desk === 'F1-07').name).toBeNull();
  });
  it('Selected date only — other dates never carry names into this day', () => {
    open(NOW, { storage: withDoc([{ ...booking, showName: true }, { ...booking, date: '2026-10-23', showName: true }]), host: HOST });
    const day = readDay('2026-10-22', NOW, { names: true });
    expect(day.desks.filter((d) => d.name)).toHaveLength(1);
  });
});

describe('US-013 tomorrow() (storage.md §3.6)', () => {
  it('next working day, counts and status per floor, no names; follows a cancel', () => {
    const f2 = Array.from({ length: 25 }, (_, i) => ({
      ...booking, desk: `F2-${String(i + 1).padStart(2, '0')}`, floor: 2, name: `P${i}`, nameKey: `p${i}`, showName: true,
    }));
    const s = new FakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, seededAt: null, bookings: f2, pastCounts: {} }) });
    open(NOW, { storage: s, host: HOST });
    const t = tomorrow(NOW);
    expect(t).toEqual({ ok: true, date: '2026-10-22', floors: [
      { floor: 1, booked: 0, capacity: 30, status: 'green' },
      { floor: 2, booked: 25, capacity: 25, status: 'red' },
    ] });
    expect(JSON.stringify(t)).not.toMatch(/P\d/);
    cancel({ date: '2026-10-22', desk: 'F2-01', name: 'P0' }, NOW);
    expect(tomorrow(NOW).floors[1]).toEqual({ floor: 2, booked: 24, capacity: 25, status: 'amber' });
  });
});
