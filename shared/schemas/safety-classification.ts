// Safety classification result — output of the deterministic safety
// router. The model classifier may OVERRIDE a `green` to `amber` or
// an `amber` to `red`, but it may NEVER downgrade. ADR-002 §8.

import type { SafetyLevel, SafetyReasonCode } from '../constants/safety';

export interface SafetyClassification {
  level: SafetyLevel;
  reasonCodes: ReadonlyArray<SafetyReasonCode>;
  /** True when amber/red and the message must surface professional-referral copy. */
  requiresProfessionalReferral: boolean;
  /** True only for `red`. Triggers `escalationCopy`. */
  requiresImmediateEscalation: boolean;
  /** Copy identifier to surface (looked up in `SAFETY_COPY`). */
  copyId: 'wellnessDisclaimer' | 'escalationCopy' | 'wellnessScope';
  /** Deterministic classifier audit trail. No raw user text. */
  evidence: ReadonlyArray<{ reasonCode: SafetyReasonCode; matchedPatternId: string }>;
}

export function green(level: SafetyLevel, codes: ReadonlyArray<SafetyReasonCode>): SafetyClassification {
  const requiresProfessionalReferral = level === 'amber';
  const requiresImmediateEscalation = level === 'red';
  const copyId = level === 'red' ? 'escalationCopy' : level === 'amber' ? 'wellnessScope' : 'wellnessDisclaimer';
  return {
    level,
    reasonCodes: codes,
    requiresProfessionalReferral,
    requiresImmediateEscalation,
    copyId,
    evidence: codes.map((reasonCode) => ({ reasonCode, matchedPatternId: 'deterministic_v1' })),
  };
}