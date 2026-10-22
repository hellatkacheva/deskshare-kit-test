import { describe, it, expect } from 'vitest';
import { FakeStorage } from './fake-storage.js';
import { book, open, readDay } from '../../public/js/storage.js';
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
