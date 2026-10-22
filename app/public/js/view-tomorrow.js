// "Tomorrow" view (ui.md §4, US-013): next working day, booked / capacity and a status per floor. No names.
import { TEXT } from './messages.js';
import * as store from './storage.js';

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) if (c) node.append(c);
  return node;
}

export function renderTomorrow(root, now) {
  const result = store.tomorrow(now);
  root.querySelector('#tomorrow-title').textContent = TEXT.tomorrowTitle(result.date);
  root.querySelector('#tomorrow-floors').replaceChildren(...result.floors.map(({ floor, booked, capacity, status }) => {
    const card = el('div', { className: `floor-card status-${status}` }, [
      el('p', { className: 'floor-card-head' }, [
        el('span', { textContent: TEXT.floorLabel(floor) }),
        // colour + word, so the status does not depend on colour alone (US-013 UI notes)
        el('span', { className: 'status-word', textContent: TEXT.status[status] }),
      ]),
      el('p', { textContent: TEXT.bookedOfCapacity(booked, capacity) }),
    ]);
    card.dataset.floor = String(floor);
    return card;
  }));
}
