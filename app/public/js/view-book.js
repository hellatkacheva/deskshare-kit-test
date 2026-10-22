// Book view (ui.md §2): date strip, floor tabs, counts.
import { FLOORS } from './config.js';
import { TEXT } from './messages.js';
import { defaultDate, isBookable, windowDates } from './rules.js';
import * as store from './storage.js';
import { formatDate, weekdayName } from './time.js';

const ui = { selectedDate: null, selectedFloor: FLOORS[0].id };

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) node.append(c);
  return node;
}

function renderStrip(root, now, rerender) {
  const strip = root.querySelector('#date-strip');
  strip.replaceChildren(...windowDates(now).map(({ date, bookable }) => {
    const btn = el('button', { type: 'button', disabled: !bookable, className: 'day' }, [
      el('span', { className: 'day-name', textContent: weekdayName(date) }),
      el('span', { className: 'day-num', textContent: date.slice(8) }),
    ]);
    btn.setAttribute('aria-label', formatDate(date));
    btn.setAttribute('aria-pressed', String(date === ui.selectedDate));
    btn.addEventListener('click', () => {
      ui.selectedDate = date;
      rerender();
    });
    return btn;
  }));
}

function renderFloors(root, day, rerender) {
  root.querySelector('#floor-tabs').replaceChildren(...day.floors.map(({ floor, left }) => {
    const btn = el('button', { type: 'button', className: 'floor-tab', textContent: TEXT.floorTab(floor, left) });
    btn.setAttribute('aria-pressed', String(floor === ui.selectedFloor));
    btn.addEventListener('click', () => {
      ui.selectedFloor = floor;
      rerender();
    });
    return btn;
  }));
  root.querySelector('#counts').replaceChildren(...day.floors.map(({ floor, booked, left }) =>
    el('p', { className: 'counts-line', textContent: TEXT.countsLine(floor, booked, left) })));
}

/** Re-render from storage for `now` (every action, every tick — DEC-028). */
export function renderBook(root, now, rerender) {
  // I-9: a selected date that left the window falls back to the default date.
  if (!ui.selectedDate || !isBookable(ui.selectedDate, now)) ui.selectedDate = defaultDate(now);
  renderStrip(root, now, rerender);
  const day = store.readDay(ui.selectedDate, now);
  if (day.ok) renderFloors(root, day, rerender);
}
