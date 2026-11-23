// The times a salon can offer. Each owner chooses which of these are open.
export const MORNING_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
];
export const AFTERNOON_SLOTS = [
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
];
export const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

// The times this salon has opened. A salon that never chose any offers all of them.
export function openSlotsOf(salon) {
  return Array.isArray(salon?.openSlots) ? salon.openSlots : ALL_SLOTS;
}