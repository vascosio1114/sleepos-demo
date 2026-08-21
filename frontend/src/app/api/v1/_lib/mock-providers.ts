// Server-side mock provider implementations.
// Mirrors frontend/src/lib/voice-advice/mock-providers.ts (drift caught in review).

import type {
  AdviceOutput,
  BrainScoreSnapshot,
  HealthCheckin,
  SpeakableAudio,
  TranscriptResult,
  TranscriptSegment,
  VoiceSessionConfig,
} from "./types";
import {
  SAFETY_COPY,
  buildSafeFallbackAdvice,
  classifySafety,
  cryptoRandomUUID,
  isProhibited,
  synthesizeEscalation,
  validateAdviceOutput,
  buildSeedBrainSnapshot,
} from "./safety";

const LOW_CONFIDENCE_THRESHOLD = 0.78;

export function defaultSessionConfig(): VoiceSessionConfig {
  return {
    sttProviderKey: "mock",
    providerMode: "mock",
    language: "en-US",
    maxSessionSeconds: 180,
    maxChunkBytes: 256 * 1024,
    lowConfidenceThreshold: LOW_CONFIDENCE_THRESHOLD,
  };
}

export function scenarioToTranscriptResult(input: {
  sessionId: string;
  transcript: { text: string; confidence: number; flagged?: boolean }[];
  language: "en-US";
}): TranscriptResult {
  let cursor = 0;
  const segments: TranscriptSegment[] = input.transcript.map((line) => {
    const durationMs = Math.max(800, line.text.length * 60);
    const segment: TranscriptSegment = {
      segmentId: cryptoRandomUUID(),
      text: line.text,
      language: input.language,
      confidence: line.confidence,
      startedAtMs: cursor,
      endedAtMs: cursor + durationMs,
      isConfirmed: false,
      userEdited: false,
    };
    cursor += durationMs + 200;
    return segment;
  });

  return {
    sessionId: input.sessionId,
    segments,
    language: input.language,
    finalizedAt: new Date().toISOString(),
  };
}

export function generateMockAdvice(input: {
  adviceRunId: string;
  transcriptText: string;
  checkin: HealthCheckin;
}): AdviceOutput {
  const safety = classifySafety({ transcriptText: input.transcriptText, checkin: input.checkin });

  if (safety.level === "red") {
    return buildSafeFallbackAdvice({
      adviceRunId: input.adviceRunId,
      safetyLevel: "red",
      safetyReasonCodes: safety.reasonCodes,
    });
  }

  const observations = buildObservations(input.checkin, input.transcriptText, safety);
  const adviceItems = safety.level === "amber" ? [] : buildAdviceItems(input.checkin);
  const brainDomains = buildBrainDomainExplanation(input.checkin);
  const escalation = safety.level === "amber" ? synthesizeEscalation("amber", safety.reasonCodes) : null;
  const summary = buildSummary(input.checkin, safety);
  const speakableText = buildSpeakableText({ summary, adviceItems, escalation });

  const candidate: AdviceOutput = {
    adviceRunId: input.adviceRunId,
    status: "succeeded",
    safetyLevel: safety.level,
    safetyReasonCodes: safety.reasonCodes,
    summary,
    observations,
    adviceItems,
    brainDomains,
    sourceIds: ["sleep-hygiene-fundamentals-en-v1", "relaxation-breathing-en-v1", "sleepos-brain-training-context-en-v1"],
    followUpQuestion: typeof input.checkin.sleepMinutes === "number" && input.checkin.sleepMinutes < 360
      ? "Want to focus on one sleep change tonight or spread them across the week?"
      : null,
    escalation,
    speakableText,
    provenance: {
      promptVersion: "advice-prompt-mock-v1",
      knowledgeVersion: "kb-en-2026-08-19-draft",
      safetyReasonCodes: safety.reasonCodes,
      adviceProviderKey: "mock",
    },
  };

  const validation = validateAdviceOutput(candidate);
  if (!validation.valid) {
    return buildSafeFallbackAdvice({
      adviceRunId: input.adviceRunId,
      safetyLevel: safety.level,
      safetyReasonCodes: safety.reasonCodes,
    });
  }
  return candidate;
}

function buildObservations(checkin: HealthCheckin, transcriptText: string, safety: { reasonCodes: string[] }) {
  const observations: AdviceOutput["observations"] = [];
  const sleep = checkin.sleepMinutes;
  if (typeof sleep === "number") {
    if (sleep < 360) {
      observations.push({
        statement: "Sleep last night was shorter than the seven-hour guideline.",
        evidenceMetricKeys: ["sleepMinutes"],
        uncertainty: "Self-reported; based on your usual pattern.",
      });
    } else if (sleep > 480) {
      observations.push({
        statement: "Sleep last night was within your usual range.",
        evidenceMetricKeys: ["sleepMinutes"],
        uncertainty: "Self-reported; based on your usual pattern.",
      });
    }
  } else {
    observations.push({
      statement: "Sleep duration was not confirmed.",
      evidenceMetricKeys: ["sleepMinutes"],
      uncertainty: "No recent data for this metric.",
    });
  }
  if (typeof checkin.stressScore === "number" && checkin.stressScore >= 7) {
    observations.push({
      statement: "Reported stress was elevated today.",
      evidenceMetricKeys: ["stressScore"],
      uncertainty: "Self-reported; may not match physiological signals.",
    });
  }
  if (typeof checkin.focusScore === "number" && checkin.focusScore <= 60) {
    observations.push({
      statement: "Reported focus was lower than usual.",
      evidenceMetricKeys: ["focusScore"],
      uncertainty: "Self-reported; one signal among many.",
    });
  }
  if (safety.reasonCodes.includes("diagnosis_request")) {
    observations.push({
      statement: "Your question asks for a diagnosis, which SleepOS does not provide.",
      evidenceMetricKeys: [],
      uncertainty: "A qualified clinician can interpret these patterns.",
    });
  }
  if (safety.reasonCodes.includes("medication_change_request")) {
    observations.push({
      statement: "You mentioned a change to medication, which is outside SleepOS scope.",
      evidenceMetricKeys: [],
      uncertainty: "Please speak with the prescribing clinician.",
    });
  }
  if (observations.length === 0) {
    observations.push({
      statement: transcriptText.trim().length > 0 ? "We heard you." : "We have no recent data.",
      evidenceMetricKeys: [],
      uncertainty: "Nothing was reported for today's check-in.",
    });
  }
  return observations;
}

function buildAdviceItems(checkin: HealthCheckin): AdviceOutput["adviceItems"] {
  const items: AdviceOutput["adviceItems"] = [];
  if (typeof checkin.sleepMinutes === "number" && checkin.sleepMinutes < 360) {
    items.push({
      title: "Try a wind-down routine",
      reason: "Consistent pre-sleep habits may support recovery.",
      actionType: "routine",
      routineKey: "wind_down_30_min_no_screens",
      durationMinutes: 30,
      riskLevel: "low",
    });
  }
  if (typeof checkin.stressScore === "number" && checkin.stressScore >= 7) {
    items.push({
      title: "Try a 3-minute breathing reset",
      reason: "Slow breathing is associated with reduced stress on self-report.",
      actionType: "breathing",
      routineKey: null,
      durationMinutes: 3,
      riskLevel: "low",
    });
  }
  if (typeof checkin.focusScore === "number" && checkin.focusScore <= 60) {
    items.push({
      title: "Try a 3-minute attention reset",
      reason: "A short attention task is the SleepOS brain training.",
      actionType: "brain_training",
      routineKey: null,
      durationMinutes: 3,
      riskLevel: "low",
    });
  }
  if (items.length === 0) {
    items.push({
      title: "Take a wind-down break",
      reason: "A consistent bedtime routine supports recovery.",
      actionType: "routine",
      routineKey: "wind_down_30_min_no_screens",
      durationMinutes: 30,
      riskLevel: "low",
    });
  }
  return items.slice(0, 3);
}

function buildBrainDomainExplanation(checkin: HealthCheckin): AdviceOutput["brainDomains"] {
  const domains: AdviceOutput["brainDomains"] = [];
  if (typeof checkin.focusScore === "number") {
    domains.push({
      key: "attention",
      score: clampBrainScore(checkin.focusScore),
      source: "self_report",
      measured: false,
      explanation: "Self-reported focus mapped to attention for context only; not a measured score.",
    });
  }
  if (typeof checkin.stressScore === "number") {
    domains.push({
      key: "regulation",
      score: clampBrainScore(100 - checkin.stressScore * 10),
      source: "self_report",
      measured: false,
      explanation: "Higher reported stress lowered the regulation score; this is contextual only.",
    });
  }
  if (typeof checkin.sleepMinutes === "number") {
    domains.push({
      key: "sleep_arousal",
      score: clampBrainScore(Math.min(100, Math.round((checkin.sleepMinutes / 480) * 100))),
      source: "self_report",
      measured: false,
      explanation: "Approximate, derived from reported sleep minutes. Not a clinical measurement.",
    });
  }
  return domains;
}

function clampBrainScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSummary(checkin: HealthCheckin, safety: { level: string; reasonCodes: string[] }): string {
  if (safety.level === "red") return "Immediate support";
  if (safety.level === "amber") {
    return safety.reasonCodes.includes("medication_change_request")
      ? "Medication is outside SleepOS"
      : safety.reasonCodes.includes("diagnosis_request")
        ? "SleepOS does not diagnose"
        : "Referral suggested";
  }
  if (typeof checkin.sleepMinutes !== "number" && typeof checkin.stressScore !== "number") {
    return "We have no recent data";
  }
  if (typeof checkin.sleepMinutes === "number" && checkin.sleepMinutes < 360) {
    return "Sleep was shorter than your usual";
  }
  if (typeof checkin.stressScore === "number" && checkin.stressScore >= 7) {
    return "Stress was elevated today";
  }
  return "You shared a steady day";
}

function buildSpeakableText(input: {
  summary: string;
  adviceItems: AdviceOutput["adviceItems"];
  escalation: AdviceOutput["escalation"];
}): string {
  if (input.escalation) return input.escalation.message;
  const intro = input.summary;
  const body = input.adviceItems.length === 0 ? " Try one small change tonight." : ` ${input.adviceItems.map((item) => item.title).join(". ")}.`;
  return intro + body + " SleepOS provides wellness information and does not replace professional medical advice.";
}

export function buildSpeakableAudio(text: string): SpeakableAudio {
  const safeText = isProhibited(text) ? SAFETY_COPY.wellnessScope.text : text;
  const durationMs = Math.max(800, Math.min(60_000, Math.round(safeText.length * 60)));
  return {
    audioBytes: null,
    mimeType: "browser:speechSynthesis",
    durationMs,
    providerKey: "mock",
    generatedAt: new Date().toISOString(),
  };
}

export function buildSyntheticBrainHistory(userId: string): BrainScoreSnapshot[] {
  const now = Date.now();
  const history: BrainScoreSnapshot[] = [];
  for (let day = 6; day >= 0; day--) {
    const capturedAt = new Date(now - day * 86_400_000).toISOString();
    const seed = buildSeedBrainSnapshot(userId);
    const attention = clampBrainScore(82 - day * 1);
    const regulation = clampBrainScore(70 - day * 2);
    const memory = clampBrainScore(82 + (day % 2 === 0 ? 1 : 0));
    const sleep = clampBrainScore(60 + day);
    history.push({
      ...seed,
      snapshotId: cryptoRandomUUID(),
      capturedAt,
      domains: [
        { key: "attention", score: attention, status: attention >= 70 ? "good" : "attention", measured: true, sourceMetricKeys: ["reactionTimeMs", "accuracyPercent"], quality: "acceptable" },
        { key: "regulation", score: regulation, status: regulation >= 70 ? "good" : "attention", measured: true, sourceMetricKeys: ["stressScore", "hrvMs"], quality: "acceptable" },
        { key: "memory", score: memory, status: memory >= 70 ? "good" : "attention", measured: true, sourceMetricKeys: ["memoryScore"], quality: "acceptable" },
        { key: "sleep_arousal", score: sleep, status: sleep >= 70 ? "good" : "attention", measured: true, sourceMetricKeys: ["sleepMinutes", "stressScore"], quality: "acceptable" },
      ],
    });
  }
  return history;
}