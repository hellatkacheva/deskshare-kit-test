import { describe, it, expect } from 'vitest';
import { FakeStorage } from './fake-storage.js';
import { open } from '../../public/js/storage.js';
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
