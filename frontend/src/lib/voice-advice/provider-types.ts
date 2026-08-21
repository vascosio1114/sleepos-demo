// Provider interfaces — the only place provider names appear.
// Mirrored from SleepOS/shared/schemas/provider-types.ts. Drift between
// the two files is the reviewer's job to catch (per Task 10 contract).

import type {
  AdviceBrainDomain,
  AdviceEscalation,
  AdviceItem,
  AdviceOutput,
  AdviceProvenance,
  AdviceProviderKey,
  BrainDomain,
  HealthCheckin,
  RoutineKey,
  SafetyClassification,
  SafetyLevel,
  SafetyReasonCode,
  SpeakableAudio,
  TtsProviderKey,
  VoiceLanguage,
} from "./types";

// Re-export the entity types for convenience to live adapter authors.
export type {
  AdviceBrainDomain,
  AdviceEscalation,
  AdviceItem,
  AdviceOutput,
  AdviceProvenance,
  HealthCheckin,
  SafetyClassification,
  SafetyLevel,
  SafetyReasonCode,
  SpeakableAudio,
};

// ---------- Speech-to-text ----------

export interface AudioChunk {
  sessionId: string;
  pcmBytes: Uint8Array;
  capturedAt: string;
  sequence: number;
  sampleRateHz?: number;
}

export interface TranscriptSegmentLocal {
  segmentId: string;
  text: string;
  language: VoiceLanguage;
  confidence: number;
  startedAtMs: number;
  endedAtMs: number;
  isConfirmed: boolean;
  userEdited: boolean;
}

export interface SpeechSession {
  sessionId: string;
  language: VoiceLanguage;
  startedAt: string;
}

export interface SpeechSessionConfig {
  sessionId: string;
  userId: string;
  language: VoiceLanguage;
  startedAt: string;
}

export interface TranscriptResultLocal {
  sessionId: string;
  segments: TranscriptSegmentLocal[];
  language: VoiceLanguage;
  finalizedAt: string;
}

export interface SpeechToTextProvider {
  readonly providerKey: "mock" | "google_stt_v2" | "gemini_live";
  startSession(input: SpeechSessionConfig): Promise<SpeechSession>;
  transcribeChunk(input: AudioChunk): Promise<TranscriptSegmentLocal>;
  finishSession(sessionId: string): Promise<TranscriptResultLocal>;
}

// ---------- Advice (text) ----------

export interface ValidatedObservation {
  ruleId: string;
  statement: string;
  evidenceMetricKeys: string[];
  uncertainty: string;
}

export interface ValidatedHealthCheckin {
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

export type AllowedAdviceActionType = "brain_training" | "breathing" | "sleep_goal" | "routine";

export interface ValidatedAdviceInput {
  userId: string;
  localDate: string;
  language: VoiceLanguage;
  checkin: ValidatedHealthCheckin;
  observations: ValidatedObservation[];
  knowledgeChunkIds: string[];
  allowedActionTypes: AllowedAdviceActionType[];
  maxSpeakableTextChars: number;
  safetyClassification: SafetyClassification;
  knowledgeVersion: string;
  promptVersion: string;
}

export interface AdviceItemDraft {
  title: string;
  reason: string;
  actionType: "brain_training" | "breathing" | "sleep_goal" | "routine";
  routineKey: RoutineKey | null;
  durationMinutes: number;
  riskLevel: "low";
}

export interface AdviceBrainDomainDraft {
  key: BrainDomain;
  score: number;
  source: "assessment" | "wearable" | "self_report" | "demo";
  measured: boolean;
  explanation: string;
}

export interface AdviceObservationDraft {
  statement: string;
  evidenceMetricKeys: string[];
  uncertainty: string;
}

export interface AdviceEscalationDraft {
  level: SafetyLevel;
  message: string;
}

export interface AdviceProvenanceDraft {
  promptVersion: string;
  knowledgeVersion: string;
  safetyReasonCodes: SafetyReasonCode[];
  adviceProviderKey: AdviceProviderKey;
}

// Draft is the in-process shape an adapter returns. It must round-trip
// into `AdviceOutput` cleanly. We keep the field names and types
// aligned with `AdviceOutput` to make conversion straightforward.
export interface AdviceDraft {
  adviceRunId: string;
  status: "pending" | "succeeded" | "failed_safe_fallback";
  safetyLevel: SafetyLevel;
  safetyReasonCodes: SafetyReasonCode[];
  summary: string;
  observations: AdviceObservationDraft[];
  adviceItems: AdviceItemDraft[];
  brainDomains: AdviceBrainDomainDraft[];
  sourceIds: string[];
  followUpQuestion: string | null;
  escalation: AdviceEscalationDraft | null;
  speakableText: string;
  provenance: AdviceProvenanceDraft;
}

export interface AdviceProvider {
  readonly providerKey: AdviceProviderKey;
  generate(input: ValidatedAdviceInput): Promise<AdviceDraft>;
}

// ---------- Text-to-speech ----------

export interface SpeakableAdvice {
  text: string;
  language: VoiceLanguage;
  rate?: number;
  voice?: string;
}

export interface TextToSpeechProvider {
  readonly providerKey: TtsProviderKey;
  synthesize(input: SpeakableAdvice): Promise<SpeakableAudio>;
}
