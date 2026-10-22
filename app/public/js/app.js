// Boot and page shell (architecture.md §3, ui.md §1).
import { REFRESH_INTERVAL_SECONDS, RESET_PARAM } from './config.js';
import { initClock, now } from './clock.js';
import { MESSAGES, TEXT } from './messages.js';
import * as store from './storage.js';
import { namesOn, renderBook, setNames } from './view-book.js';
import { renderTomorrow } from './view-tomorrow.js';

const $ = (id) => document.getElementById(id);
const BOOK_HASH = '#/';
const TOMORROW_HASH = '#/tomorrow';

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function renderShell() {
  $('banner').textContent = TEXT.banner;
  $('app-name').textContent = TEXT.appName;
  $('date-strip').setAttribute('aria-label', TEXT.dateStrip);
  $('floor-tabs').setAttribute('aria-label', TEXT.floorTabs);
  $('names-switch').setAttribute('aria-label', TEXT.namesSwitch);
  $('names-switch-label').textContent = TEXT.namesSwitch;
  $('names-switch').addEventListener('click', () => {
    setNames(!namesOn());
    refresh();
  });
}

const onTomorrow = () => location.hash === TOMORROW_HASH;

function renderStatus() {
  const box = $('status');
  const state = store.storageState();
  const message = state === 'unavailable' ? MESSAGES.STORAGE_OFF
    : state === 'unreadable' ? MESSAGES.STORAGE_UNREADABLE : '';
  box.textContent = message;
  box.hidden = !message;
  // ui.md §3.6: nothing is rendered from unreadable data.
  $('book-view').hidden = state === 'unreadable' || onTomorrow();
  $('tomorrow-view').hidden = state === 'unreadable' || !onTomorrow();
}

function renderNav() {
  const tomorrow = onTomorrow();
  $('nav-link').textContent = tomorrow ? TEXT.bookLink : TEXT.tomorrowLink;
  $('nav-link').href = tomorrow ? BOOK_HASH : TOMORROW_HASH;
  // The names switch belongs to the desk grid (US-010 UI notes).
  $('names-switch').hidden = tomorrow;
  $('names-switch').setAttribute('aria-checked', String(namesOn()));
  $('names-switch-state').textContent = namesOn() ? TEXT.on : TEXT.off;
}

function refresh() {
  renderStatus();
  renderNav();
  if (store.storageState() === 'unreadable') return;
  if (onTomorrow()) renderTomorrow($('tomorrow-view'), now());
  else renderBook($('book-view'), now(), refresh);
}

initClock({ host: location.hostname, search: location.search });
const opened = store.open(now(), { storage: browserStorage(), host: location.hostname, search: location.search });
if (opened.resetDone) {
  // US-002 rule 9: a later reload must not reset again.
  const url = new URL(location.href);
  url.searchParams.delete(RESET_PARAM);
  history.replaceState(null, '', url);
}
renderShell();
refresh();
setInterval(refresh, REFRESH_INTERVAL_SECONDS * 1000);
window.addEventListener('hashchange', refresh);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refresh();
});
