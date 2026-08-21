// Voice session entity. Pairs with `voice-session.schema.json`.

import type { SttProviderKey, VoiceLanguage, VoiceSessionState } from '../constants/voice-languages';

export interface VoiceSession {
  /** UUID. */
  sessionId: string;
  /** Profile subject ID; `demo_001` for synthetic demo. */
  userId: string;
  /** Lifecycle state machine. */
  state: VoiceSessionState;
  /** Provider that produced the transcript. */
  sttProviderKey: SttProviderKey;
  /** BCP-47 language code used for the session. */
  language: VoiceLanguage;
  /** UTC ISO 8601. */
  startedAt: string;
  /** UTC ISO 8601. */
  completedAt: string | null;
  /** UTC ISO 8601. */
  abandonedAt: string | null;
  /** Final session duration in seconds (rounded). */
  durationSeconds: number | null;
  /** Number of confirmed transcript segments. */
  confirmedSegmentCount: number;
  /** Number of segments flagged for confirmation. */
  flaggedSegmentCount: number;
  /** Schema version of the speech-to-text adapter that produced the transcript. */
  schemaVersion: string;
  /** Audit trail; never contains raw audio bytes. */
  notes: ReadonlyArray<{ at: string; code: string; detail?: string }>;
}

/**
 * Type guard for `VoiceSessionState`. Use this at trust boundaries
 * (HTTP request body, DB row read into the domain) to fail closed.
 */
export function isVoiceSessionState(value: unknown): value is VoiceSessionState {
  return (
    typeof value === 'string' &&
    [
      'requested',
      'opening',
      'recording',
      'transcribing',
      'awaiting_confirmation',
      'confirmed',
      'analyzing',
      'awaiting_advice',
      'speaking',
      'completed',
      'abandoned',
      'failed',
    ].includes(value)
  );
}