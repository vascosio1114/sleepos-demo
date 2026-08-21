// SleepOS advice action allowlist.
// Mirrors and extends the `ActionType` enum in docs/SHARED_KEYS.md §5.
// The `routine` value is a Phase 3 additive extension; existing three
// values retain their wire representation and behaviour.

import type { ActionType } from './action-type-re-export';

export const ADVICE_ACTION_TYPES = [
  'brain_training',
  'breathing',
  'sleep_goal',
  'routine',
] as const;

export type AdviceActionType = (typeof ADVICE_ACTION_TYPES)[number];

// Cross-reference helper so we don't depend on importing SHARED_KEYS
// from the frontend bundle. Keep in sync with the canonical enum.
export const ACTION_TYPE_REUSE: Readonly<Record<AdviceActionType, true>> = {
  brain_training: true,
  breathing: true,
  sleep_goal: true,
  routine: true,
};

// Routine keys — pre-approved wellness routines. Adding a new key
// requires `docs/knowledge/initial-english-set.md` review and a
// change to this list. No raw free-form routines are accepted.
export const ROUTINE_KEYS = [
  'consistent_wake_time',
  'wind_down_30_min_no_screens',
  'no_caffeine_after_2pm',
  'morning_daylight_10_min',
  'regular_meal_times',
  'hydration_balance',
  'bedroom_dark_cool_quiet',
  'short_walk_after_dinner',
] as const;
export type RoutineKey = (typeof ROUTINE_KEYS)[number];

// Duration bounds per action type. Anything outside the bounds is
// rejected by the output validator. Durations are integer minutes.
export const ACTION_DURATION_BOUNDS_MIN: Readonly<Record<AdviceActionType, { min: number; max: number; defaultMinutes: number }>> = {
  brain_training: { min: 1, max: 15, defaultMinutes: 3 },
  breathing: { min: 1, max: 20, defaultMinutes: 3 },
  sleep_goal: { min: 0, max: 0, defaultMinutes: 0 }, // time-of-day goal, not duration
  routine: { min: 0, max: 0, defaultMinutes: 0 }, // habit, not duration
};

// Risk levels. The AI advice output validator rejects any item whose
// `riskLevel` is not `low`. Amber / red risk levels are reserved for
// explicit human-curated escalation content.
export const ADVICE_RISK_LEVELS = ['low'] as const;
export type AdviceRiskLevel = (typeof ADVICE_RISK_LEVELS)[number];

// Maximum number of advice items per run. Three is also the Plan cap
// from PRD §6.4; this is intentional.
export const MAX_ADVICE_ITEMS_PER_RUN = 3;

// Maximum advice `speakableText` length in characters. Speech synthesis
// cost grows with length; shorter is calmer for late-night users.
export const MAX_SPEAKABLE_TEXT_LENGTH = 600;

// Reserved `ActionType` re-export so this file is self-contained.
// The canonical source remains docs/SHARED_KEYS.md §5.
export type { ActionType };