// Book view (ui.md §2–3): date strip, floor tabs, counts, grid, dialogs.
import { FLOORS } from './config.js';
import { now as clockNow } from './clock.js';
import { MESSAGES, TEXT } from './messages.js';
import { defaultDate, isBookable, windowDates } from './rules.js';
import * as store from './storage.js';
import { formatDate, weekdayName } from './time.js';

// names: the demo switch (US-010) — a JS variable only, so it is Off after every reload (REQ-038).
const ui = { selectedDate: null, selectedFloor: FLOORS[0].id, names: false };

export function setNames(on) {
  ui.names = on;
}

export function namesOn() {
  return ui.names;
}
let rerender = () => {};

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) if (c) node.append(c);
  return node;
}

// ---- Dialogs (ui.md §3) — the tick never closes an open dialog (I-9) ----

const dialog = () => document.getElementById('dialog');

function openDialog(...children) {
  const dlg = dialog();
  // The demo banner is shown in every dialog too (US-001 rule 3).
  // Skip empty parts like el() does — replaceChildren(null) would render the text "null" (B-7).
  dlg.replaceChildren(el('p', { className: 'banner dialog-banner', textContent: TEXT.banner }), ...children.filter(Boolean));
  if (!dlg.open) dlg.showModal();
}

function closeDialog() {
  const dlg = dialog();
  if (dlg.open) dlg.close();
}

function button(text, onClick, className = '') {
  const btn = el('button', { type: 'button', textContent: text, className });
  btn.addEventListener('click', onClick);
  return btn;
}

function nameField(id, labelText = TEXT.nameLabel) {
  const input = el('input', { id, type: 'text', autocomplete: 'off', spellcheck: false });
  const label = el('label', { htmlFor: id, textContent: labelText });
  // REQ-040: the self-reported notice sits next to every name field (US-012).
  const notice = el('p', { className: 'notice', textContent: TEXT.selfReported });
  return { input, nodes: [label, input, notice] };
}

function showConfirmation(booking) {
  openDialog(
    el('h2', { textContent: TEXT.bookedTitle }),
    el('p', { textContent: TEXT.dateLine(booking.date) }),
    el('p', { textContent: TEXT.deskLine(booking.desk) }),
    booking.note ? el('p', { className: 'note', textContent: TEXT.yourNote(booking.note) }) : null,
    el('p', { className: 'deadline', textContent: TEXT.checkInBy(booking.deadline) }),
    el('p', { className: 'hint', textContent: TEXT.hint }),
    el('div', { className: 'actions' }, [button(TEXT.done, closeDialog, 'primary')]),
  );
}

/** ui.md §3.1 — booking form for a free desk. */
function openBookForm(date, desk, floor) {
  const name = nameField('book-name');
  // US-018: optional note, no maxlength — 51 characters are refused with the message (I-19).
  const noteInput = el('input', { id: 'book-note', type: 'text', autocomplete: 'off' });
  const noteNodes = [
    el('label', { htmlFor: 'book-note', textContent: TEXT.noteLabel }),
    noteInput,
    el('p', { className: 'notice', textContent: TEXT.noteHint }),
  ];
  const error = el('p', { className: 'error', role: 'alert' });
  const submit = el('button', { type: 'submit', textContent: TEXT.bookButton, className: 'primary' });
  // Variant B only: consent checkbox, unchecked (REQ-027). Switch Off → stored without consent.
  const consent = ui.names ? el('input', { type: 'checkbox', id: 'book-consent' }) : null;
  const consentRow = consent
    ? el('label', { className: 'consent', htmlFor: 'book-consent' }, [consent, ` ${TEXT.consent}`])
    : null;
  const form = el('form', { className: 'dialog-form' }, [
    el('h2', { textContent: TEXT.bookTitle(desk) }),
    el('p', { textContent: TEXT.bookSubtitle(date, floor) }),
    ...name.nodes,
    ...noteNodes,
    consentRow,
    error,
    el('div', { className: 'actions' }, [button(TEXT.close, closeDialog), submit]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const showName = Boolean(consent?.checked);
    const result = store.book({ date, desk, name: name.input.value, showName, note: noteInput.value }, clockNow());
    rerender();
    if (result.ok) showConfirmation(result.booking);
    else error.textContent = result.message;
  });
  openDialog(form);
  name.input.focus();
}

/** ui.md §3.3 — check-in (booking day only, I-6) and cancel for a taken desk. */
function openActions(date, desk, deadlineStamp, note) {
  const isToday = date === clockNow().date;
  const deadlineLine = deadlineStamp
    ? el('p', { className: 'deadline', textContent: isToday ? TEXT.deadlineToday(deadlineStamp) : TEXT.deadlineOn(deadlineStamp) })
    : null;
  const name = nameField('action-name', TEXT.nameAsBooked);
  const error = el('p', { className: 'error', role: 'alert' });
  const info = el('p', { className: 'info', role: 'status' });
  const checkInBtn = isToday
    ? button(TEXT.checkInButton, () => {
      const result = store.checkIn({ date, desk, name: name.input.value }, clockNow());
      rerender();
      error.textContent = result.ok ? '' : result.message;
      info.textContent = result.ok ? (result.message ?? TEXT.checkedIn) : '';
    }, 'primary')
    : null;
  const notToday = isToday ? null : el('p', { className: 'info', textContent: MESSAGES.NOT_BOOKING_DAY });
  const cancelBtn = button(TEXT.cancelButton, () => {
    const result = store.cancel({ date, desk, name: name.input.value }, clockNow());
    rerender();
    if (result.ok) closeDialog();
    else error.textContent = result.message;
  });
  openDialog(el('div', { className: 'dialog-form' }, [
    el('h2', { textContent: TEXT.actionsTitle(desk, date) }),
    note ? el('p', { className: 'note', textContent: TEXT.noteLine(note) }) : null,
    deadlineLine,
    notToday,
    ...name.nodes,
    error,
    info,
    el('div', { className: 'actions' }, [checkInBtn, cancelBtn, button(TEXT.close, closeDialog)]),
  ]));
  name.input.focus();
}

// ---- Page ----

function renderStrip(root, now) {
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

function renderFloors(root, day) {
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
  // ui.md §3.5: hard stop — no free tile, no waitlist (US-006).
  const full = day.floors.find((f) => f.floor === ui.selectedFloor).full;
  const notice = root.querySelector('#floor-full');
  notice.textContent = full ? MESSAGES.FLOOR_FULL : '';
  notice.hidden = !full;
}

function renderGrid(root, day) {
  const grid = root.querySelector('#grid');
  const date = ui.selectedDate;
  const canAct = store.storageState() === 'ready'; // US-001 rule 5: no actions without storage
  grid.setAttribute('aria-label', TEXT.grid(ui.selectedFloor));
  grid.replaceChildren(...day.desks.filter((d) => d.floor === ui.selectedFloor).map((d) => {
    // Variant A: "taken" (REQ-026). Variant B: the consenting booker's name, as plain text (REQ-028, REQ-035).
    // Taken desks stay tappable (US-004 rule 5).
    const label = d.name ?? (d.taken ? TEXT.taken : TEXT.free);
    const btn = el('button', { type: 'button', className: `tile ${d.taken ? 'tile-taken' : 'tile-free'}` }, [
      el('span', { className: 'tile-desk', textContent: d.desk }),
      el('span', { className: 'tile-state', textContent: label }),
    ]);
    btn.setAttribute('aria-label', `${d.desk} ${label}`);
    btn.dataset.desk = d.desk;
    btn.addEventListener('click', () => {
      if (!canAct) return;
      if (d.taken) openActions(date, d.desk, d.deadline, d.note);
      else openBookForm(date, d.desk, d.floor);
    });
    return btn;
  }));
}

/** Re-render from storage for `now` (every action, every tick — DEC-028). */
export function renderBook(root, now, onChange) {
  rerender = onChange;
  // I-9: a selected date that left the window falls back to the default date.
  if (!ui.selectedDate || !isBookable(ui.selectedDate, now)) ui.selectedDate = defaultDate(now);
  renderStrip(root, now);
  const day = store.readDay(ui.selectedDate, now, { names: ui.names });
  if (!day.ok) return;
  renderFloors(root, day);
  // Wherever names are shown, the self-reported notice is shown too (REQ-040, US-011 rule 7).
  const notice = root.querySelector('#grid-notice');
  notice.textContent = ui.names ? TEXT.selfReported : '';
  notice.hidden = !ui.names;
  renderGrid(root, day);
}
