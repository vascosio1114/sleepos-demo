// Health check-in entity — the five self-report fields + optional
// confirmed note. Pairs with `health-checkin.schema.json`.
//
// Five fields follow the A2A Voice + Brain Integration Plan §2.1
// (sleep quality, sleep duration, stress, mood, focus). Bounds match
// the canonical metric ranges in SHARED_KEYS §3.

export interface HealthCheckin {
  checkinId: string;
  userId: string;
  /** YYYY-MM-DD in the profile timezone. */
  localDate: string;
  /** Schema version of this checkin shape. */
  schemaVersion: string;
  /** UTC ISO 8601 when the user confirmed the values. */
  capturedAt: string;
  /** Source of the values; required so the UI can label. */
  source: 'voice_confirmed' | 'manual_entry';
  /** 0..100; null if user said "don't know" / not collected. */
  sleepQualityScore: number | null;
  /** 0..1440 minutes; null if not collected. */
  sleepMinutes: number | null;
  /** 0..10; null if not collected. */
  stressScore: number | null;
  /** 0..10; null if not collected. */
  moodScore: number | null;
  /** 0..100; null if not collected. */
  focusScore: number | null;
  /** Optional confirmed free-text note. Never raw ASR. */
  confirmedNote: string | null;
  /** IDs of transcript segments that informed these values. */
  sourceSegmentIds: ReadonlyArray<string>;
}

export const HEALTH_CHECKIN_SCHEMA_VERSION = 'health-checkin-v1' as const;

export const HEALTH_CHECKIN_FIELD_BOUNDS = {
  sleepQualityScore: { min: 0, max: 100 },
  sleepMinutes: { min: 0, max: 1440 },
  stressScore: { min: 0, max: 10 },
  moodScore: { min: 0, max: 10 },
  focusScore: { min: 0, max: 100 },
} as const;