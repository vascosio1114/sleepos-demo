// Provider interfaces — the only place provider names appear.
// Implementations live in `backend/src/providers/<name>/` and adapt
// vendor SDKs (Google Cloud Speech-to-Text V2, MiniMax, etc.) into
// the shapes declared here. Domain code depends on these interfaces
// exclusively; it never imports an SDK directly.

import type { AdviceRiskLevel, AdviceActionType, RoutineKey } from '../constants/action-allowlist';
import type {
  SttProviderKey,
  AdviceProviderKey,
  TtsProviderKey,
  VoiceLanguage,
} from '../constants/voice-languages';
import type { SafetyLevel, SafetyReasonCode } from '../constants/safety';

// ---------- Speech-to-text ----------

export interface SpeechSessionConfig {
  /** Voice check-in session ID; UUID. */
  sessionId: string;
  /** Profile subject ID (or `demo_001`). */
  userId: string;
  /** BCP-47 language code. */
  language: VoiceLanguage;
  /** Optional preferred provider; service may override. */
  providerHint?: SttProviderKey;
  /** UTC ISO 8601. */
  startedAt: string;
}

export interface AudioChunk {
  sessionId: string;
  /** PCM 16-bit mono at `sampleRateHz` when provided. */
  pcmBytes: Uint8Array;
  /** Actual captured sample rate. Browser devices often capture at 48000 Hz. */
  sampleRateHz?: number;
  /** UTC ISO 8601 client-side capture time. */
  capturedAt: string;
  /** Monotonic sequence for ordering; provider may reorder. */
  sequence: number;
}

export interface TranscriptSegment {
  segmentId: string;
  text: string;
  language: VoiceLanguage;
  /** 0..1 */
  confidence: number;
  startedAtMs: number;
  endedAtMs: number;
  /** Required to be `true` before downstream analysis runs. */
  isConfirmed: boolean;
}

export interface TranscriptResult {
  sessionId: string;
  segments: TranscriptSegment[];
  /** Aggregated language, taken from the dominant segment. */
  language: VoiceLanguage;
  /** UTC ISO 8601 finalization time. */
  finalizedAt: string;
}

export interface SpeechSession {
  sessionId: string;
  language: VoiceLanguage;
  startedAt: string;
}

export interface SpeechToTextProvider {
  /** Name for logs / telemetry; not authoritative — env config wins. */
  readonly providerKey: SttProviderKey;
  startSession(input: SpeechSessionConfig): Promise<SpeechSession>;
  transcribeChunk(input: AudioChunk): Promise<TranscriptSegment>;
  finishSession(sessionId: string): Promise<TranscriptResult>;
}

// ---------- Advice (text generation) ----------

export interface ValidatedObservation {
  /** Allowlisted deterministic rule ID; see SHARED_KEYS §6. */
  ruleId: string;
  /** Plain-language summary produced by the deterministic engine. */
  statement: string;
  /** Metric keys that back the statement. */
  evidenceMetricKeys: ReadonlyArray<string>;
  /** Explicit uncertainty copy written by the deterministic engine, not the model. */
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
  /** Confirmed free-text note; never raw ASR output. */
  confirmedNote: string | null;
}

export interface ValidatedAdviceInput {
  userId: string;
  localDate: string; // YYYY-MM-DD
  language: VoiceLanguage;
  checkin: ValidatedHealthCheckin;
  observations: ReadonlyArray<ValidatedObservation>;
  knowledgeChunkIds: ReadonlyArray<string>;
  /** Allowlist for what the model may emit. */
  allowedActionTypes: ReadonlyArray<AdviceActionType>;
  /** Hard limit on response length. */
  maxSpeakableTextChars: number;
  /** Pre-classified safety level for the input. */
  safetyClassification: {
    level: SafetyLevel;
    reasonCodes: ReadonlyArray<SafetyReasonCode>;
  };
  /** Knowledge bundle version; required for audit. */
  knowledgeVersion: string;
  /** Prompt / model version; required for audit. */
  promptVersion: string;
}

export interface AdviceItemDraft {
  title: string;
  reason: string;
  actionType: AdviceActionType;
  /** For routine actions, the canonical routine identifier. */
  routineKey?: RoutineKey;
  durationMinutes: number;
  riskLevel: AdviceRiskLevel;
}

export interface AdviceBrainDomainDraft {
  key: 'attention' | 'regulation' | 'memory' | 'sleep_arousal';
  /** Score from deterministic engine; model may NOT invent or alter this. */
  score: number;
  /** Provenance label for the UI. */
  source: 'assessment' | 'wearable' | 'self_report' | 'demo';
  /** Whether the score is from a measured source. */
  measured: boolean;
  /** Brief explanation, written by the model, that links to evidence. */
  explanation: string;
}

export interface AdviceDraft {
  /** One-sentence summary suitable for the Insights header. */
  summary: string;
  observations: ReadonlyArray<{ statement: string; evidenceMetricKeys: ReadonlyArray<string>; uncertainty: string }>;
  adviceItems: ReadonlyArray<AdviceItemDraft>;
  /** The model may surface the brain-domain explanation only; never invent. */
  brainDomains: ReadonlyArray<AdviceBrainDomainDraft>;
  /** Knowledge source IDs cited in this advice. */
  sourceIds: ReadonlyArray<string>;
  /** Optional follow-up question for the user. */
  followUpQuestion: string | null;
  /** Set when safety classification was amber / red. */
  escalation: { level: SafetyLevel; message: string } | null;
  /** Plain-language text the TTS provider reads aloud. */
  speakableText: string;
  /** Provenance identifiers required by the audit log. */
  provenance: {
    promptVersion: string;
    knowledgeVersion: string;
    safetyReasonCodes: ReadonlyArray<SafetyReasonCode>;
    adviceProviderKey: AdviceProviderKey;
  };
}

export interface AdviceProvider {
  readonly providerKey: AdviceProviderKey;
  generate(input: ValidatedAdviceInput): Promise<AdviceDraft>;
}

// ---------- Text-to-speech ----------

export interface SpeakableAdvice {
  /** Pre-validated, schema-conformant text. */
  text: string;
  language: VoiceLanguage;
  /** Suggested rate (0.5..1.5); provider may clamp. */
  rate?: number;
  /** Optional voice identifier (provider-specific). */
  voice?: string;
}

export interface AudioResult {
  /** PCM bytes (signed 16-bit) or provider-specific format; documented by adapter. */
  audioBytes: Uint8Array;
  /** MIME type the browser should use to decode. */
  mimeType: string;
  /** UTC ISO 8601; does NOT trigger retention. */
  generatedAt: string;
  /** Provider identifier for logging. */
  providerKey: TtsProviderKey;
  /** Rough duration estimate so the UI can render a waveform. */
  durationMs: number;
}

export interface TextToSpeechProvider {
  readonly providerKey: TtsProviderKey;
  synthesize(input: SpeakableAdvice): Promise<AudioResult>;
}
