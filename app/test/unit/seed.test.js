import { describe, it, expect } from 'vitest';
import { SEED_ROWS } from '../../public/js/seed-data.js';
import { buildSeed } from '../../public/js/seed.js';
import { FLOORS } from '../../public/js/config.js';
import { desksOf, nameKey } from '../../public/js/rules.js';

const WED_0800 = { date: '2026-10-21', time: '08:00' };
const AC_AND_STAKEHOLDER_NAMES = ['alex morgan', 'jamie lee', 'sam rivera', 'kim',
  'priya nandakumar', 'dana whitfield', 'sam okafor', 'olga tkacheva'];

const count = (bookings, date, floor) => bookings.filter((b) => b.date === date && b.floor === floor).length;

describe('seed rows (demo-data.md §8)', () => {
  it('86 rows, desks only from F1-01…F1-30 / F2-01…F2-25', () => {
    expect(SEED_ROWS).toHaveLength(86);
    const all = FLOORS.flatMap((f) => desksOf(f.id));
    for (const r of SEED_ROWS) expect(all).toContain(r.desk);
  });

  it('totals per day and floor as §2; consent only on D0 (4 + 2)', () => {
    const t = (day, p) => SEED_ROWS.filter((r) => r.day === day && r.desk.startsWith(p)).length;
    expect([t('D0', 'F1-'), t('D0', 'F2-'), t('D1', 'F1-'), t('D1', 'F2-'), t('D2', 'F1-'), t('D2', 'F2-')])
      .toEqual([10, 8, 25, 25, 12, 6]);
    const consent = SEED_ROWS.filter((r) => r.showName);
    expect(consent.every((r) => r.day === 'D0')).toBe(true);
    expect(consent.filter((r) => r.desk.startsWith('F1-'))).toHaveLength(4);
    expect(consent.filter((r) => r.desk.startsWith('F2-'))).toHaveLength(2);
    const checkedIn = (p) => SEED_ROWS.filter((r) => r.day === 'D0' && r.checkedIn && r.desk.startsWith(p)).length;
    expect([checkedIn('F1-'), checkedIn('F2-')]).toEqual([6, 5]);
  });

  it('no AC or stakeholder names (fictional only)', () => {
    for (const r of SEED_ROWS) expect(AC_AND_STAKEHOLDER_NAMES).not.toContain(nameKey(r.name));
  });
});

describe('US-002 Seed demo data', () => {
  it('Seed content relative to today', () => {
    const b = buildSeed(WED_0800).bookings;
    expect([count(b, '2026-10-22', 1), count(b, '2026-10-22', 2)]).toEqual([25, 25]);
    const today = b.filter((x) => x.date === '2026-10-21');
    expect(today.some((x) => x.checkedInAt)).toBe(true);
    expect(today.some((x) => !x.checkedInAt)).toBe(true);
    expect(b.some((x) => x.showName && ['2026-10-21', '2026-10-22'].includes(x.date))).toBe(true);
    expect(new Set(b.map((x) => x.date))).toEqual(new Set(['2026-10-21', '2026-10-22', '2026-10-23']));
  });

  it('Deadline of seeded unconfirmed bookings — seeded before 09:30', () => {
    const open = buildSeed(WED_0800).bookings.filter((x) => x.date === '2026-10-21' && !x.checkedInAt);
    expect(open).toHaveLength(7);
    for (const x of open) expect(x.deadline).toBe('2026-10-21T10:00');
  });

  it('Deadline of seeded unconfirmed bookings — seeded after 09:30', () => {
    const open = buildSeed({ date: '2026-10-21', time: '11:00' }).bookings
      .filter((x) => x.date === '2026-10-21' && !x.checkedInAt);
    for (const x of open) expect(x.deadline).toBe('2026-10-21T11:30');
  });

  it('Seed follows the booking rules', () => {
    const b = buildSeed(WED_0800).bookings;
    const desks = b.map((x) => `${x.date} ${x.desk}`);
    const names = b.map((x) => `${x.date} ${x.nameKey}`);
    expect(new Set(desks).size).toBe(b.length);
    expect(new Set(names).size).toBe(b.length);
  });

  it('Seed on a weekend', () => {
    const b = buildSeed({ date: '2026-10-24', time: '12:00' }).bookings;
    expect(new Set(b.map((x) => x.date))).toEqual(new Set(['2026-10-26', '2026-10-27', '2026-10-28']));
    const d0 = b.filter((x) => x.date === '2026-10-26');
    expect(d0).toHaveLength(18);
    for (const x of d0) {
      expect(x.checkedInAt).toBeNull();
      expect(x.deadline).toBe('2026-10-26T10:00');
    }
  });

  it('checked-in D0 rows on a working day are checked in at seed time; D1/D2 deadline 10:00', () => {
    const b = buildSeed(WED_0800).bookings;
    expect(b.filter((x) => x.checkedInAt === '2026-10-21T08:00')).toHaveLength(11);
    for (const x of b.filter((y) => y.date !== '2026-10-21')) expect(x.deadline).toBe(`${x.date}T10:00`);
  });
});
