// Validated advice input. Pairs with `advice-input.schema.json`.
// Domain code MUST pass through the input validator before handing
// this to an `AdviceProvider`; no raw check-in, transcript, or metric
// values cross the trust boundary.

import type { VoiceLanguage } from '../constants/voice-languages';
import type { AdviceActionType } from '../constants/action-allowlist';
import type { SafetyLevel, SafetyReasonCode } from '../constants/safety';

export interface ValidatedHealthCheckinShape {
  checkinId: string;
  userId: string;
  capturedAt: string;
  sleepMinutes: number | null;
  sleepQualityScore: number | null;
  stressScore: number | null;
  moodScore: number | null;
  focusScore: number | null;
  confirmedNote: string | null;
}

export interface ValidatedObservationShape {
  ruleId: string;
  statement: string;
  evidenceMetricKeys: ReadonlyArray<string>;
  uncertainty: string;
}

export interface SafetyClassificationShape {
  level: SafetyLevel;
  reasonCodes: ReadonlyArray<SafetyReasonCode>;
  requiresProfessionalReferral: boolean;
  requiresImmediateEscalation: boolean;
}

export interface ValidatedAdviceInputShape {
  userId: string;
  localDate: string;
  language: VoiceLanguage;
  checkin: ValidatedHealthCheckinShape;
  observations: ReadonlyArray<ValidatedObservationShape>;
  knowledgeChunkIds: ReadonlyArray<string>;
  allowedActionTypes: ReadonlyArray<AdviceActionType>;
  maxSpeakableTextChars: number;
  safetyClassification: SafetyClassificationShape;
  knowledgeVersion: string;
  promptVersion: string;
}