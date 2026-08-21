// Safety router + copy identifiers + prohibited phrase patterns.
// Mirrored from shared/constants/safety.ts.

import type {
  AdviceActionType,
  AdviceBrainDomain,
  AdviceEscalation,
  AdviceItem,
  AdviceObservation,
  AdviceOutput,
  BrainDomainScore,
  BrainScoreSnapshot,
  HealthCheckin,
  KnowledgeChunk,
  KnowledgeDocument,
  RoutineKey,
  SafetyClassification,
  SafetyCopyId,
  SafetyLevel,
  SafetyReasonCode,
  TranscriptSegment,
} from "./types";

export const SAFETY_COPY: Record<SafetyCopyId, { text: string; reviewStatus: "approved" | "pending" }> = {
  wellnessDisclaimer: {
    text: "SleepOS provides wellness information and does not replace professional medical advice or diagnosis.",
    reviewStatus: "approved",
  },
  wellnessScope: {
    text: "SleepOS helps you understand your sleep, train your brain, and choose low-risk wellness actions. It is not a diagnostic tool and does not replace professional care.",
    reviewStatus: "pending",
  },
  escalationCopy: {
    text: "This sounds urgent. Please contact a local emergency service or a trusted person right now. SleepOS does not provide emergency support. If you are in [REGION], you can call [REGIONAL_HOTLINE].",
    reviewStatus: "pending",
  },
};

interface SafetyPattern {
  id: string;
  reasonCode: SafetyReasonCode;
  pattern: RegExp;
}

const CRISIS_SELF_HARM_PATTERNS: SafetyPattern[] = [
  { id: "crisis_sh_kill_myself", reasonCode: "crisis_self_harm", pattern: /\b(kill myself|end my life|end it all|suicide|want to die|be better off dead|better off dead)\b/i },
  { id: "crisis_sh_self_harm", reasonCode: "crisis_self_harm", pattern: /\b(self[- ]harm|cut myself|hurt myself)\b/i },
];

const MEDICAL_EMERGENCY_PATTERNS: SafetyPattern[] = [
  { id: "med_emergency_chest_pain", reasonCode: "crisis_medical_emergency", pattern: /\b(severe chest pain|chest pain|heart attack)\b/i },
  { id: "med_emergency_breathing", reasonCode: "crisis_medical_emergency", pattern: /\b(can'?t breathe|cannot breathe|severe shortness of breath|shortness of breath)\b/i },
  { id: "med_emergency_consciousness", reasonCode: "crisis_medical_emergency", pattern: /\b(passed out|loss of consciousness|fainting|fainted)\b/i },
  { id: "med_emergency_stroke", reasonCode: "crisis_medical_emergency", pattern: /\b(stroke|slurred speech|one[- ]sided weakness)\b/i },
];

const DIAGNOSIS_REQUEST_PATTERNS: SafetyPattern[] = [
  { id: "diag_do_i_have", reasonCode: "diagnosis_request", pattern: /\b(do i have|do i suffer from|am i)\b.*\b(insomnia|sleep disorder|sleep apnea|apnea|depressed|depression|anxious|anxiety|adhd|narcolepsy|narcoleptic|adhd|autism|bipolar)\b/i },
  { id: "diag_could_this_be", reasonCode: "diagnosis_request", pattern: /\b(could this be|is this|do i have|am i)\b.*\b(insomnia|sleep disorder|sleep apnea|apnea|depression|anxiety|adhd|narcolepsy|narcoleptic|bipolar|autism)\b/i },
  { id: "diag_can_you", reasonCode: "diagnosis_request", pattern: /\b(can you diagnose|will you diagnose)\b/i },
  { id: "diag_tell_me", reasonCode: "diagnosis_request", pattern: /\btell me (what|if) (disease|condition|diagnosis|wrong)\b/i },
  { id: "diag_tell_me_about", reasonCode: "diagnosis_request", pattern: /\btell me\b.*\b(diagnosis|condition|disease)\b/i },
  { id: "diag_what_disease", reasonCode: "diagnosis_request", pattern: /\bwhat disease\b/i },
];

const MEDICATION_CHANGE_PATTERNS: SafetyPattern[] = [
  { id: "med_stop_start", reasonCode: "medication_change_request", pattern: /\b(can i|should i|may i|do i)\b.*\b(stop|quit|start|increase|decrease|change|double)\b.*\b(medication|medicine|pills?|prescription|dose|dosage)\b/i },
  { id: "med_alternative", reasonCode: "medication_change_request", pattern: /\b(alternative to|instead of|natural alternative)\b.*\b(medication|medicine|pills?|prescription)\b/i },
  { id: "med_named_drug", reasonCode: "medication_change_request", pattern: /\b(melatonin|ambien|zolpidem|benadryl|valium|xanax|modafinil|antidepressant)\b/i },
  { id: "med_prescribe", reasonCode: "medication_change_request", pattern: /\b(write|give) (a|me) prescription\b/i },
];

const PROMPT_INJECTION_PATTERNS: SafetyPattern[] = [
  // "act as [clinician]" alone is a bypass attempt but not a health claim;
  // require a follow-up health-claim verb to route to amber. Bare "act as a doctor"
  // without a request stays green (handled as ordinary advice).
  { id: "injection_act_as_prescribe", reasonCode: "medication_change_request", pattern: /\bact as\b.*\b(doctor|therapist|physician|psychiatrist)\b.*\b(prescrib|prescription|recommend|diagnos)\b/i },
  { id: "injection_act_as_diagnose", reasonCode: "diagnosis_request", pattern: /\bact as\b.*\b(doctor|therapist|physician|psychiatrist)\b.*\b(diagnos|what'?s wrong|what'?s the (diagnosis|condition))\b/i },
];

const SUSTAINED_DECLINE_PATTERNS: SafetyPattern[] = [
  { id: "sustained_weeks", reasonCode: "sustained_decline_self_report", pattern: /\b(for weeks|for months|haven'?t slept|exhausted|can'?t function|broken|gone)\b/i },
];

const PROHIBITED_PATTERNS: { id: string; pattern: RegExp; rationale: string }[] = [
  { id: "diag_you_have", pattern: /\byou (have|are suffering from|are diagnosed with)\b/i, rationale: "No diagnostic claim" },
  { id: "cause_claim", pattern: /\b(caused|causes|is the reason|is why)\b/i, rationale: "No causation claims" },
  { id: "cure_claim", pattern: /\b(cure|cures|treats|treatment for)\b/i, rationale: "No treatment claims" },
  { id: "unverified_percent", pattern: /\b\d{1,3}\s?%\b.*\b(effective|cure|treatment|improvement|reduction)\b/i, rationale: "No unsourced percentages" },
  { id: "qEEG_misclaim", pattern: /\b(qEEG|brain scan)\b/i, rationale: "No claim that self-report is a clinical brain scan" },
  { id: "regional_misclaim", pattern: /\b(frontal lobe|parietal lobe|temporal lobe|amygdala|hippocampus|prefrontal cortex)\b.*\b(score|measurement|abnormal)\b/i, rationale: "No measured regional brain score without QEEG / HEG source" },
];

export const ALL_SAFETY_PATTERNS: SafetyPattern[] = [
  ...CRISIS_SELF_HARM_PATTERNS,
  ...MEDICAL_EMERGENCY_PATTERNS,
  ...DIAGNOSIS_REQUEST_PATTERNS,
  ...MEDICATION_CHANGE_PATTERNS,
  ...PROMPT_INJECTION_PATTERNS,
  ...SUSTAINED_DECLINE_PATTERNS,
];

const SEVERITY: Record<SafetyReasonCode, number> = {
  crisis_self_harm: 100,
  crisis_medical_emergency: 100,
  diagnosis_request: 60,
  medication_change_request: 60,
  sustained_decline_self_report: 60,
  conflicting_metric_signals: 30,
  minor_low_risk_wellness: 10,
  no_signals: 0,
};

function matchesAny(text: string, patterns: SafetyPattern[]): SafetyPattern[] {
  return patterns.filter((candidate) => candidate.pattern.test(text));
}

export function classifySafety(input: {
  transcriptText: string;
  checkin: Pick<HealthCheckin, "stressScore" | "moodScore" | "focusScore" | "sleepMinutes"> | null;
}): SafetyClassification {
  const evidence: { reasonCode: SafetyReasonCode; matchedPatternId: string }[] = [];
  const reasonCodes = new Set<SafetyReasonCode>();

  for (const match of matchesAny(input.transcriptText, ALL_SAFETY_PATTERNS)) {
    reasonCodes.add(match.reasonCode);
    evidence.push({ reasonCode: match.reasonCode, matchedPatternId: match.id });
  }

  if (input.checkin) {
    const { stressScore, moodScore, focusScore } = input.checkin;
    if (
      typeof stressScore === "number" &&
      typeof moodScore === "number" &&
      typeof focusScore === "number"
    ) {
      // Sustained-decline heuristic: 2 of 3 concerning indicators.
      // - stress >= 7 (elevated)
      // - mood  <= 3 (low)
      // - focus <= 50 (below typical)
      const concerning =
        (stressScore >= 7 ? 1 : 0) +
        (moodScore <= 3 ? 1 : 0) +
        (focusScore <= 50 ? 1 : 0);
      if (concerning >= 2 && !reasonCodes.has("sustained_decline_self_report")) {
        reasonCodes.add("sustained_decline_self_report");
        evidence.push({ reasonCode: "sustained_decline_self_report", matchedPatternId: "deterministic_metric_v2" });
      }
    }
  }

  if (evidence.length === 0) {
    reasonCodes.add("minor_low_risk_wellness");
    evidence.push({ reasonCode: "minor_low_risk_wellness", matchedPatternId: "default_v1" });
  }

  let level: SafetyLevel = "green";
  for (const code of reasonCodes) {
    if (SEVERITY[code] >= 90) {
      level = "red";
      break;
    }
    if (SEVERITY[code] >= 50) {
      level = "amber";
    }
  }

  const requiresImmediateEscalation = level === "red";
  const requiresProfessionalReferral = level === "amber" || reasonCodes.has("sustained_decline_self_report");
  const copyId: SafetyCopyId = level === "red" ? "escalationCopy" : level === "amber" ? "wellnessScope" : "wellnessDisclaimer";

  return {
    level,
    reasonCodes: Array.from(reasonCodes),
    requiresProfessionalReferral,
    requiresImmediateEscalation,
    copyId,
    evidence,
  };
}

export function isProhibited(text: string): { id: string; rationale: string } | null {
  for (const candidate of PROHIBITED_PATTERNS) {
    if (candidate.pattern.test(text)) return { id: candidate.id, rationale: candidate.rationale };
  }
  return null;
}

export function classifySegments(segments: TranscriptSegment[], threshold: number) {
  const flaggedIds = new Set<string>();
  for (const segment of segments) {
    if (segment.confidence < threshold) flaggedIds.add(segment.segmentId);
    if (/\b(didn't|do not|didn't|dont|not|no)\b/i.test(segment.text) && segment.confidence < 0.9) {
      flaggedIds.add(segment.segmentId);
    }
  }
  return { flaggedIds };
}

export function validateAdviceOutput(output: AdviceOutput): { valid: boolean; reason?: string } {
  if (!output.summary || output.summary.length > 160) return { valid: false, reason: "summary length invalid" };
  if (output.adviceItems.length > 3) return { valid: false, reason: "too many advice items" };
  // Per A2A plan §7.1: green emits ≤3 items, amber emits 0 (referral), red emits 0 (escalation).
  // Only green requires non-empty adviceItems.
  if (output.adviceItems.length === 0 && output.safetyLevel === "green") {
    return { valid: false, reason: "green routing must emit advice items" };
  }
  for (const item of output.adviceItems) {
    if (item.riskLevel !== "low") return { valid: false, reason: "advice items must be risk-level low" };
    if (!ALLOWED_ADVICE_ACTION_TYPES.has(item.actionType)) {
      return { valid: false, reason: `advice item actionType "${item.actionType}" not in allowlist` };
    }
    if (item.actionType === "routine") {
      if (!item.routineKey || !ALLOWED_ROUTINE_KEYS.has(item.routineKey)) {
        return { valid: false, reason: `routine advice missing or invalid routineKey "${item.routineKey}"` };
      }
    } else if (item.routineKey) {
      return { valid: false, reason: `non-routine advice should not set routineKey` };
    }
  }
  for (const text of [output.summary, output.speakableText, ...output.adviceItems.map((item) => item.title + " " + item.reason)]) {
    const hit = isProhibited(text);
    if (hit) return { valid: false, reason: `prohibited phrase: ${hit.id}` };
  }
  if ((output.safetyLevel === "red" || output.safetyLevel === "amber") && output.adviceItems.length > 0) {
    return { valid: false, reason: "amber/red routing must not emit advice items" };
  }
  return { valid: true };
}

const ALLOWED_ADVICE_ACTION_TYPES = new Set<AdviceActionType>(["brain_training", "breathing", "sleep_goal", "routine"]);
// Mirror of the canonical RoutineKey list. Drift caught by reviewer.
const ALLOWED_ROUTINE_KEYS = new Set<RoutineKey>([
  "consistent_wake_time",
  "wind_down_30_min_no_screens",
  "no_caffeine_after_2pm",
  "morning_daylight_10_min",
  "regular_meal_times",
  "hydration_balance",
  "bedroom_dark_cool_quiet",
  "short_walk_after_dinner",
]);

export function synthesizeEscalation(level: SafetyLevel, reasonCodes: SafetyReasonCode[]): AdviceEscalation {
  if (level === "red") {
    return {
      level: "red",
      message: SAFETY_COPY.escalationCopy.text,
    };
  }
  if (level === "amber") {
    return {
      level: "amber",
      message:
        reasonCodes.includes("diagnosis_request")
          ? "SleepOS does not diagnose conditions. A qualified clinician can help interpret these patterns."
          : reasonCodes.includes("medication_change_request")
            ? "SleepOS does not advise on medications. Please speak with the clinician who prescribes them."
            : "These signals may benefit from a conversation with a qualified clinician. SleepOS does not diagnose or treat conditions.",
    };
  }
  return { level: "green", message: SAFETY_COPY.wellnessScope.text };
}

export function buildSafeFallbackAdvice(input: {
  adviceRunId: string;
  safetyLevel: SafetyLevel;
  safetyReasonCodes: SafetyReasonCode[];
}): AdviceOutput {
  const emptyObservations: AdviceObservation[] = [];
  const emptyBrainDomains: AdviceBrainDomain[] = [];
  const escalation = synthesizeEscalation(input.safetyLevel, input.safetyReasonCodes);
  return {
    adviceRunId: input.adviceRunId,
    status: "failed_safe_fallback",
    safetyLevel: input.safetyLevel,
    safetyReasonCodes: input.safetyReasonCodes,
    summary: input.safetyLevel === "red" ? "Immediate support" : input.safetyLevel === "amber" ? "Referral suggested" : "Gentle next step",
    observations: emptyObservations,
    adviceItems: [],
    brainDomains: emptyBrainDomains,
    sourceIds: [],
    followUpQuestion: null,
    escalation,
    speakableText: escalation.message,
    provenance: {
      promptVersion: "advice-prompt-mock-v1",
      knowledgeVersion: "kb-empty-v0",
      safetyReasonCodes: input.safetyReasonCodes,
      adviceProviderKey: "mock",
    },
  };
}

export function buildEmptyBrainSnapshot(): BrainScoreSnapshot {
  return {
    snapshotId: "",
    userId: "demo_001",
    capturedAt: "",
    protocolVersion: "brain-domain-v1",
    mode: "self_report",
    assessorId: null,
    domains: [
      { key: "attention", score: 0, status: "no_data", measured: false, sourceMetricKeys: [], quality: "unverified" },
      { key: "regulation", score: 0, status: "no_data", measured: false, sourceMetricKeys: [], quality: "unverified" },
      { key: "memory", score: 0, status: "no_data", measured: false, sourceMetricKeys: [], quality: "unverified" },
      { key: "sleep_arousal", score: 0, status: "no_data", measured: false, sourceMetricKeys: [], quality: "unverified" },
    ],
    regionalScores: [],
    fiveDScores: [],
    disclaimerKey: "wellness_not_diagnosis",
  };
}

export function buildSeedBrainSnapshot(userId: string): BrainScoreSnapshot {
  const now = new Date().toISOString();
  const domains: BrainDomainScore[] = [
    { key: "attention", score: 78, status: "good", measured: true, sourceMetricKeys: ["reactionTimeMs", "accuracyPercent"], quality: "acceptable" },
    { key: "regulation", score: 64, status: "attention", measured: true, sourceMetricKeys: ["stressScore", "hrvMs"], quality: "acceptable" },
    { key: "memory", score: 82, status: "good", measured: true, sourceMetricKeys: ["memoryScore"], quality: "acceptable" },
    { key: "sleep_arousal", score: 56, status: "attention", measured: true, sourceMetricKeys: ["sleepMinutes", "stressScore"], quality: "acceptable" },
  ];
  return {
    snapshotId: cryptoRandomUUID(),
    userId,
    capturedAt: now,
    protocolVersion: "brain-domain-v1",
    mode: "self_report",
    assessorId: null,
    domains,
    regionalScores: [],
    fiveDScores: [],
    disclaimerKey: "wellness_not_diagnosis",
  };
}

export function cryptoRandomUUID(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type { AdviceItem, KnowledgeChunk, KnowledgeDocument };