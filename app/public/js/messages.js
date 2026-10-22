// All user texts (config.md §3; storage.md §4; ui.md §1).
import { BOOKING_WINDOW_DAYS, NAME_MAX_LENGTH, OFFICE_TZ_LABEL } from './config.js';
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
  namesSwitch: "Show colleagues' names",
  off: 'Off',
  on: 'On',
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
  // Deadline lines (US-017; NFR-009 zone label)
  deadlineLabel: (stamp) => `${stamp.slice(11)} office time (${OFFICE_TZ_LABEL})`,
  checkInBy: (stamp) => `Please check in by ${TEXT.deadlineLabel(stamp)} on ${formatDate(stamp.slice(0, 10))}.`,
  deadlineToday: (stamp) => `Check-in deadline: ${TEXT.deadlineLabel(stamp)}`,
  deadlineOn: (stamp) => `Check-in deadline: ${TEXT.deadlineLabel(stamp)} on ${formatDate(stamp.slice(0, 10))}`,
  selfReported: 'Names are self-reported — not for emergency headcount.',
  // Booking actions — cancel / check-in (ui.md §3.3)
  actionsTitle: (desk, date) => `Desk ${desk} · ${formatDate(date)}`,
  nameAsBooked: 'Your name (as booked)',
  cancelButton: 'Cancel booking',
  checkInButton: 'Check in',
  checkedIn: 'Checked in ✓',
};

// Result codes of storage operations (storage.md §4)
export const MESSAGES = {
  STORAGE_OFF: 'Bookings cannot be saved in this browser — browser storage is turned off.',
  STORAGE_UNREADABLE: 'Saved bookings could not be read in this browser. Clear site data to reload demo data.',
  DATE_NOT_BOOKABLE: `This date can't be booked — please pick a weekday from today up to ${BOOKING_WINDOW_DAYS} days ahead.`,
  SAME_DAY_CLOSED: 'Booking for today is closed — please pick another date',
  UNKNOWN_DESK: 'This desk does not exist.',
  FLOOR_FULL: 'This floor is full for this day — please pick another day or floor.',
  DESK_TAKEN: 'This desk is already taken — pick another desk.',
  NAME_REQUIRED: 'Please enter your name.',
  NAME_TOO_LONG: `Name is too long — maximum ${NAME_MAX_LENGTH} characters.`,
  NAME_ALREADY_BOOKED: 'This name already has a booking for that day.',
  NO_BOOKING: ({ desk, date }) => `There is no booking for ${desk} on ${formatDate(date)}.`,
  NAME_MISMATCH: 'The name does not match the booking.',
  NOT_BOOKING_DAY: 'Check-in is only possible on the booking day.',
  RELEASED: ({ deadline }) => `Too late — the booking was released at ${TEXT.deadlineLabel(deadline)}.`,
  ALREADY_CHECKED_IN: 'This booking is already checked in.',
};
