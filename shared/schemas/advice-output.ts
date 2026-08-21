// Strict advice output schema. Pairs with `advice-output.schema.json`.
// ADR-002: any output that fails this schema is discarded and replaced
// with a deterministic safe fallback; the model output is never
// surfaced in a partially-validated form.

import type { AdviceActionType, AdviceRiskLevel, RoutineKey } from '../constants/action-allowlist';
import type { BrainDomain } from '../constants/brain-domains';
import type { AdviceProviderKey } from '../constants/voice-languages';
import type { SafetyLevel, SafetyReasonCode } from '../constants/safety';

export interface AdviceObservation {
  statement: string;
  evidenceMetricKeys: ReadonlyArray<string>;
  uncertainty: string;
}

export interface AdviceItem {
  title: string;
  reason: string;
  actionType: AdviceActionType;
  /** Required when `actionType === 'routine'`; must be an allowlisted routine. */
  routineKey: RoutineKey | null;
  durationMinutes: number;
  riskLevel: AdviceRiskLevel;
}

export interface AdviceBrainDomain {
  key: BrainDomain;
  /** 0..100. The deterministic engine provides the value; the model only explains. */
  score: number;
  source: 'assessment' | 'wearable' | 'self_report' | 'demo';
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
  safetyReasonCodes: ReadonlyArray<SafetyReasonCode>;
  adviceProviderKey: AdviceProviderKey;
}

export interface AdviceOutput {
  /** One-sentence summary, ≤ 160 chars. */
  summary: string;
  observations: ReadonlyArray<AdviceObservation>;
  /** Max 3 items; PRD §6.4 + A2A §13. */
  adviceItems: ReadonlyArray<AdviceItem>;
  brainDomains: ReadonlyArray<AdviceBrainDomain>;
  /** Knowledge source IDs cited; required to be non-empty when `adviceItems.length > 0`. */
  sourceIds: ReadonlyArray<string>;
  followUpQuestion: string | null;
  /** Required when safety classification was amber or red. */
  escalation: AdviceEscalation | null;
  /** ≤ MAX_SPEAKABLE_TEXT_LENGTH chars. TTS reads this verbatim. */
  speakableText: string;
  provenance: AdviceProvenance;
}

/**
 * Type guard. Use at every trust boundary that consumes model output.
 * Fails closed on any extra / missing field.
 */
export function isAdviceOutput(value: unknown): value is AdviceOutput {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.summary !== 'string' || v.summary.length === 0 || v.summary.length > 160) return false;
  if (!Array.isArray(v.observations) || v.observations.length > 16) return false;
  if (!Array.isArray(v.adviceItems) || v.adviceItems.length === 0 || v.adviceItems.length > 3) return false;
  if (!Array.isArray(v.brainDomains) || v.brainDomains.length > 4) return false;
  if (!Array.isArray(v.sourceIds)) return false;
  if (typeof v.followUpQuestion !== 'string' && v.followUpQuestion !== null) return false;
  if (!v.escalation || typeof v.escalation !== 'object') return false;
  if (typeof v.speakableText !== 'string' || v.speakableText.length === 0) return false;
  if (!v.provenance || typeof v.provenance !== 'object') return false;
  return true;
}