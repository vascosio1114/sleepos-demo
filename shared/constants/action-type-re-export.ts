// Single source of truth for the `ActionType` enum wire values.
// Mirrored from docs/SHARED_KEYS.md §5. Update both at the same time.

export const ACTION_TYPES = [
  'brain_training',
  'breathing',
  'sleep_goal',
  // Additive value introduced for AI advice in Task 10 / ADR-002.
  // The P0 demo only ever uses the first three. `routine` represents
  // a low-risk habit change (e.g. consistent wake time) that AI advice
  // may recommend and that resolves into a calendar / reminder entry
  // rather than an in-product intervention.
  'routine',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];