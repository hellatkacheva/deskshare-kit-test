// Demo seed rows (demo-data.md §4–7, DEC-032, DEC-034). Fictional names only. 91 rows.
const N = [
  'Ava Morgan', 'Ben Carter', 'Chloe Diaz', 'Daniel Brooks', 'Ella Novak',
  'Felix Grant', 'Grace Holm', 'Hugo Silva', 'Isla Byrne', 'Jonas Weber',
  'Kira Patel', 'Leo Marsh', 'Maya Lund', 'Noah Petrov', 'Olivia Reyes',
  'Pablo Ortiz', 'Quinn Adler', 'Rosa Haas', 'Simon Ito', 'Tara Quinn',
  'Umar Sheikh', 'Vera Kovac', 'Will Hart', 'Xenia Roth', 'Yusuf Demir',
  'Zoe Lambert', 'Aaron Fields', 'Bianca Moretti', 'Carlos Vega', 'Dina Sato',
  'Erik Nilsen', 'Fatima Noor', 'George Lin', 'Hana Mori', 'Ivan Popov',
  'Julia Stone', 'Karim Haddad', 'Lena Fischer', 'Marco Rossi', 'Nina Berg',
  'Oscar Wells', 'Paula Costa', 'Rami Aziz', 'Sofia Lind', 'Tomas Kral',
  'Uma Rao', 'Victor Hale', 'Wendy Clarke', 'Yara Saleh', 'Zane Foster',
  'Amira Hassan', 'Bruno Keller', 'Clara Jensen', 'Dmitri Volkov', 'Elif Arslan', // N51–N55, DEC-034
];

// §4 D0 — [desk, name, checkedIn, showName]
const D0 = [
  ['F1-02', N[0], true, true], ['F1-03', N[1], true, true], ['F1-05', N[2], true, true],
  ['F1-08', N[3], true, false], ['F1-11', N[4], true, false], ['F1-12', N[5], true, false],
  ['F1-14', N[6], false, true], ['F1-17', N[7], false, false], ['F1-20', N[8], false, false],
  ['F1-23', N[9], false, false],
  ['F2-01', N[10], true, true], ['F2-04', N[11], true, true], ['F2-06', N[12], true, false],
  ['F2-09', N[13], true, false], ['F2-12', N[14], true, false], ['F2-15', N[15], false, false],
  ['F2-18', N[16], false, false], ['F2-21', N[17], false, false],
];

const f1 = (nums) => nums.map((n) => `F1-${String(n).padStart(2, '0')}`);
const f2 = (nums) => nums.map((n) => `F2-${String(n).padStart(2, '0')}`);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// §6 D1 and §7 D2 — desks in order, names N<first>… in desk order
const PLAIN = [
  ['D1', f1([1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30]), 1],
  ['D1', f1(range(31, 35)), 51], // DEC-034 — D1 Floor 1 = 30 of 35 (amber)
  ['D1', f2(range(1, 25)), 26],
  ['D2', f1([1, 3, 6, 9, 12, 15, 18, 21, 24, 26, 28, 30]), 26],
  ['D2', f2([2, 5, 8, 11, 14, 17]), 38],
];

export const SEED_ROWS = [
  ...D0.map(([desk, name, checkedIn, showName]) => ({ day: 'D0', desk, name, checkedIn, showName })),
  ...PLAIN.flatMap(([day, desks, first]) =>
    desks.map((desk, i) => ({ day, desk, name: N[first - 1 + i], checkedIn: false, showName: false }))),
];
