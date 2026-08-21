// Transcript segment entity. Pairs with `transcript-segment.schema.json`.

import type { VoiceLanguage } from '../constants/voice-languages';

export interface TranscriptSegment {
  segmentId: string;
  /** Confirmed text only; raw ASR output never crosses trust boundary. */
  text: string;
  language: VoiceLanguage;
  /** 0..1; below `TRANSCRIPT_LOW_CONFIDENCE_THRESHOLD` requires confirmation. */
  confidence: number;
  startedAtMs: number;
  endedAtMs: number;
  /** Must be `true` before downstream analysis runs. */
  isConfirmed: boolean;
  /** Set when the user edited the text before confirming. */
  userEdited: boolean;
  /** Optional provider-specific extras; bounded and never contains audio. */
  providerMeta?: Readonly<Record<string, string | number | boolean>>;
}

export function isTranscriptSegment(value: unknown): value is TranscriptSegment {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.segmentId === 'string' &&
    typeof v.text === 'string' &&
    typeof v.language === 'string' &&
    typeof v.confidence === 'number' &&
    typeof v.startedAtMs === 'number' &&
    typeof v.endedAtMs === 'number' &&
    typeof v.isConfirmed === 'boolean'
  );
}