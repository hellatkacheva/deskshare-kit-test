// All user texts (config.md §3; storage.md §4; ui.md §1).
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
};

export const MESSAGES = {
  STORAGE_OFF: 'Bookings cannot be saved in this browser — browser storage is turned off.',
  STORAGE_UNREADABLE: 'Saved bookings could not be read in this browser. Clear site data to reload demo data.',
};
