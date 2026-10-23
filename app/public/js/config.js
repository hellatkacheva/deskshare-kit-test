// The only module that holds assumed values (config.md). Change here, republish app/public.

// §1 Business values
export const OFFICE_UTC_OFFSET_MINUTES = 300; // ASM-017 — ASSUMPTION, not validated
export const OFFICE_TZ_LABEL = 'UTC+5'; // ASM-017 — ASSUMPTION, not validated
export const CHECKIN_CUTOFF = '10:00'; // ASM-008 — ASSUMPTION, not validated
export const SAME_DAY_THRESHOLD = '09:30'; // ASM-008 — ASSUMPTION, not validated
export const GRACE_MINUTES = 30; // ASM-008 — ASSUMPTION, not validated
export const DEADLINE_CAP = '23:59'; // DEC-024
export const BOOKING_WINDOW_DAYS = 6; // ASM-010 — ASSUMPTION, not validated
export const WORKING_DAYS = [1, 2, 3, 4, 5]; // ASM-010, DEC-013 (ISO weekdays)
export const AMBER_THRESHOLD_PERCENT = 80; // DEC-013
export const NAME_MAX_LENGTH = 50; // ASM-018 — ASSUMPTION, not validated
export const NOTE_MAX_LENGTH = 50; // REQ-047 (W4, DEC-036)
export const FLOORS = [ // REQ-003, REQ-045 (Floor 1 = 35, CHG-002), REQ-005; numbering ASM-007 — ASSUMPTION, not validated
  { id: 1, prefix: 'F1', desks: 35 },
  { id: 2, prefix: 'F2', desks: 25 },
];
export const REFRESH_INTERVAL_SECONDS = 60; // DEC-028

// §2 Technical values
export const STORAGE_KEY = 'deskshare-kit:v1';
export const STORAGE_VERSION = 1;
export const TEST_HOSTS = ['localhost', '127.0.0.1']; // NFR-010, DEC-031
export const RESET_PARAM = 'reset-demo'; // DEC-017, DEC-031
export const CLOCK_PARAM = 'now'; // NFR-010
