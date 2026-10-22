// Boot and page shell (architecture.md §3, ui.md §1).
import { REFRESH_INTERVAL_SECONDS } from './config.js';
import { initClock, now } from './clock.js';
import { MESSAGES, TEXT } from './messages.js';
import * as store from './storage.js';

const $ = (id) => document.getElementById(id);

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
}

function renderStatus() {
  const box = $('status');
  const state = store.storageState();
  const message = state === 'unavailable' ? MESSAGES.STORAGE_OFF
    : state === 'unreadable' ? MESSAGES.STORAGE_UNREADABLE : '';
  box.textContent = message;
  box.hidden = !message;
}

function refresh() {
  renderStatus();
}

initClock({ host: location.hostname, search: location.search });
store.open(now(), { storage: browserStorage(), host: location.hostname, search: location.search });
renderShell();
refresh();
setInterval(refresh, REFRESH_INTERVAL_SECONDS * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refresh();
});
