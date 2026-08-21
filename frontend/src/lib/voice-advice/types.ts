// Voice / AI Advice / Brain Score entity types.
// Mirrored from SleepOS/shared/schemas/*.ts (Task 10 canonical contracts).
// Any drift is caught by independent reviewer cross-tracing.

export type SafetyLevel = "green" | "amber" | "red";

export type SafetyReasonCode =
  | "crisis_self_harm"
  | "crisis_medical_emergency"
  | "diagnosis_request"
  | "medication_change_request"
  | "sustained_decline_self_report"
  | "conflicting_metric_signals"
  | "minor_low_risk_wellness"
  | "no_signals";

export type SafetyCopyId = "wellnessDisclaimer" | "escalationCopy" | "wellnessScope";

export type ProviderMode = "mock" | "live";

export type VoiceLanguage = "en-US" | "en-GB" | "zh-HK" | "yue-Hant-HK";

export type SttProviderKey = "mock" | "google_stt_v2" | "gemini_live";
export type AdviceProviderKey = "mock" | "minimax";
export type TtsProviderKey = "mock" | "minimax_tts";

export type VoiceSessionState =
  | "requested"
  | "opening"
  | "recording"
  | "transcribing"
  | "awaiting_confirmation"
  | "confirmed"
  | "analyzing"
  | "awaiting_advice"
  | "speaking"
  | "completed"
  | "abandoned"
  | "failed";

export type BrainDomain = "attention" | "regulation" | "memory" | "sleep_arousal";

export type BrainScoreMode = "demo" | "self_report" | "cognitive_task" | "qEEG" | "HEG";

export type BrainScoreQuality = "acceptable" | "marginal" | "poor" | "unverified";

export type BrainDomainStatus = "good" | "attention" | "no_data";

export type CheckinSource = "voice_confirmed" | "manual_entry";

export type AdviceActionType = "brain_training" | "breathing" | "sleep_goal" | "routine";

export type RoutineKey =
  | "consistent_wake_time"
  | "wind_down_30_min_no_screens"
  | "no_caffeine_after_2pm"
  | "morning_daylight_10_min"
  | "regular_meal_times"
  | "hydration_balance"
  | "bedroom_dark_cool_quiet"
  | "short_walk_after_dinner";

export interface TranscriptSegment {
  segmentId: string;
  text: string;
  language: VoiceLanguage;
  confidence: number;
  startedAtMs: number;
  endedAtMs: number;
  isConfirmed: boolean;
  userEdited: boolean;
}

export interface TranscriptResult {
  sessionId: string;
  segments: TranscriptSegment[];
  language: VoiceLanguage;
  finalizedAt: string;
}

export interface VoiceSession {
  sessionId: string;
  userId: string;
  state: VoiceSessionState;
  sttProviderKey: SttProviderKey;
  providerMode: ProviderMode;
  language: VoiceLanguage;
  audioRetention: "none" | "enabled_storage" | "research_grant";
  startedAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
  durationSeconds: number | null;
  confirmedSegmentCount: number;
  flaggedSegmentCount: number;
  schemaVersion: string;
}

export interface HealthCheckin {
  checkinId: string;
  userId: string;
  localDate: string;
  schemaVersion: "health-checkin-v1";
  source: CheckinSource;
  capturedAt: string;
  sleepQualityScore: number | null;
  sleepMinutes: number | null;
  stressScore: number | null;
  moodScore: number | null;
  focusScore: number | null;
  confirmedNote: string | null;
  sourceSegmentIds: string[];
}

export interface AdviceObservation {
  statement: string;
  evidenceMetricKeys: string[];
  uncertainty: string;
}

export interface AdviceItem {
  title: string;
  reason: string;
  actionType: AdviceActionType;
  routineKey: RoutineKey | null;
  durationMinutes: number;
  riskLevel: "low";
}

export interface AdviceBrainDomain {
  key: BrainDomain;
  score: number;
  source: "assessment" | "wearable" | "self_report" | "demo";
  measured: boolean;
  explanation: string;
}

export interface AdviceEscalation {
  level: SafetyLevel;
  message: string;
}

export interface AdviceProvenance {
  promptVersion: string;
  knowledgeVersion: string;
  safetyReasonCodes: SafetyReasonCode[];
  adviceProviderKey: AdviceProviderKey;
}

export interface AdviceOutput {
  adviceRunId: string;
  status: "pending" | "succeeded" | "failed_safe_fallback";
  safetyLevel: SafetyLevel;
  safetyReasonCodes: SafetyReasonCode[];
  summary: string;
  observations: AdviceObservation[];
  adviceItems: AdviceItem[];
  brainDomains: AdviceBrainDomain[];
  sourceIds: string[];
  followUpQuestion: string | null;
  escalation: AdviceEscalation | null;
  speakableText: string;
  provenance: AdviceProvenance;
}

export interface BrainDomainScore {
  key: BrainDomain;
  score: number;
  status: BrainDomainStatus;
  measured: boolean;
  sourceMetricKeys: string[];
  quality: BrainScoreQuality;
}

export interface BrainScoreSnapshot {
  snapshotId: string;
  userId: string;
  capturedAt: string;
  protocolVersion: "brain-domain-v1";
  mode: BrainScoreMode;
  assessorId: string | null;
  domains: BrainDomainScore[];
  regionalScores: never[];
  fiveDScores: never[];
  disclaimerKey: "wellness_not_diagnosis";
}

export interface SafetyClassification {
  level: SafetyLevel;
  reasonCodes: SafetyReasonCode[];
  requiresProfessionalReferral: boolean;
  requiresImmediateEscalation: boolean;
  copyId: SafetyCopyId;
  evidence: { reasonCode: SafetyReasonCode; matchedPatternId: string }[];
}

export interface VoiceSessionConfig {
  sttProviderKey: SttProviderKey;
  providerMode: ProviderMode;
  language: VoiceLanguage;
  maxSessionSeconds: number;
  maxChunkBytes: number;
  lowConfidenceThreshold: number;
}

export interface SpeakableAudio {
  audioBytes: Uint8Array | null;
  mimeType: string | "browser:speechSynthesis";
  durationMs: number;
  providerKey: TtsProviderKey;
  generatedAt: string;
}

export interface DemoScenario {
  id: string;
  category:
    | "ordinary_checkin"
    | "ambiguous_number"
    | "diagnosis_request"
    | "medication_change"
    | "crisis"
    | "prompt_injection"
    | "asr_misrecognition"
    | "no_data";
  title: string;
  description: string;
  transcript: { text: string; confidence: number; flagged?: boolean }[];
  checkin: Omit<HealthCheckin, "checkinId" | "userId" | "localDate" | "schemaVersion" | "capturedAt" | "source" | "sourceSegmentIds">;
  expectedSafetyLevel: SafetyLevel;
  expectedAdviceItemCount: { min: number; max: number };
  expectedProhibitedPhrases: string[];
  expectedMustInclude: string[];
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta: { requestId: string; apiVersion: "v1" };
}

export interface ApiErrorEnvelope {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "INVALID_STATE_TRANSITION"
      | "IDEMPOTENCY_CONFLICT"
      | "DEPENDENCY_UNAVAILABLE"
      | "TIMEOUT"
      | "SAFETY_ESCALATION"
      | "SCHEMA_VALIDATION_FAILED"
      | "LANGUAGE_NOT_ENABLED"
      | "AUDIO_RETENTION_FORBIDDEN"
      | "PROVIDER_MODE_FORBIDDEN"
      | "INTERNAL_ERROR";
    message: string;
    retryable: boolean;
  };
  meta: { requestId: string; apiVersion: "v1" };
}

export type RegionalScoreBrainKey =
  | "frontal"
  | "prefrontal"
  | "parietal"
  | "temporal"
  | "occipital"
  | "central"
  | "amygdala"
  | "hippocampus"
  | "cingulate"
  | "insula";

export type KnowledgeEvidenceLevel =
  | "expert_consensus"
  | "peer_reviewed"
  | "regulatory_body"
  | "industry_guideline"
  | "manufacturer_material"
  | "demo_only";

export type KnowledgeStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "superseded"
  | "withdrawn"
  | "expired";

export interface KnowledgeDocument {
  documentId: string;
  title: string;
  topic: string;
  language: string;
  sourceUrl: string;
  sourceFile: string;
  evidenceLevel: KnowledgeEvidenceLevel;
  allowedUse: string[];
  prohibitedClaims: string[];
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  version: string;
  status: KnowledgeStatus;
}

export interface KnowledgeChunk {
  chunkId: string;
  documentId: string;
  ordinal: number;
  content: string;
  topicTags: string[];
  contentHash: string;
}