// All user texts (config.md §3; storage.md §4; ui.md §1).
import { BOOKING_WINDOW_DAYS } from './config.js';
import { formatDate } from './time.js';

export const TEXT = {
  banner: 'Demo — bookings are stored in this browser only.',
  appName: 'DeskShare',
  dateStrip: 'Date',
  floorTabs: 'Floor',
  floorLabel: (id) => `Floor ${id}`,
  floorTab: (id, left) => `Floor ${id} · ${left} left`,
  countsLine: (id, booked, left) => `Floor ${id}: ${booked} booked · ${left} left`,
  grid: (id) => `Desks of Floor ${id}`,
  free: 'free',
  taken: 'taken',
  // Booking form and confirmation (ui.md §3.1, §3.2)
  bookTitle: (desk) => `Book desk ${desk}`,
  bookSubtitle: (date, floor) => `${formatDate(date)} · Floor ${floor}`,
  nameLabel: 'Your name',
  bookButton: 'Book desk',
  close: 'Close',
  done: 'Done',
  bookedTitle: 'Booked ✓',
  dateLine: (date) => `Date: ${formatDate(date)}`,
  deskLine: (desk) => `Desk: ${desk}`,
  hint: 'Note your desk number — you need it to check in or cancel',
};

// Result codes of storage operations (storage.md §4)
export const MESSAGES = {
  STORAGE_OFF: 'Bookings cannot be saved in this browser — browser storage is turned off.',
  STORAGE_UNREADABLE: 'Saved bookings could not be read in this browser. Clear site data to reload demo data.',
  DATE_NOT_BOOKABLE: `This date can't be booked — please pick a weekday from today up to ${BOOKING_WINDOW_DAYS} days ahead.`,
  UNKNOWN_DESK: 'This desk does not exist.',
  DESK_TAKEN: 'This desk is already taken — pick another desk.',
  NAME_ALREADY_BOOKED: 'This name already has a booking for that day.',
};
