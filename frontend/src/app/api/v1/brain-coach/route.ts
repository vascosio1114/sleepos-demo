import { NextRequest } from "next/server";
import { runAdvicePipeline } from "../_lib/advice-pipeline";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../_lib/responses";
import type { AdviceItem, AdviceOutput, HealthCheckin } from "../_lib/types";

interface BrainCoachRequest {
  transcriptText: string;
  idempotencyKey: string;
}

interface BrainCoachResponse {
  transcriptText: string;
  answer: AdviceOutput;
  recommendedTrainingHref: string;
}

const DOMAIN_TERMS = [
  "brain",
  "training",
  "focus",
  "attention",
  "memory",
  "stress",
  "sleep",
  "tired",
  "reaction",
  "reset",
  "calm",
  "breathing",
];

function isInBrainCoachScope(text: string) {
  const normalized = text.toLowerCase();
  return DOMAIN_TERMS.some((term) => normalized.includes(term));
}

function buildCoachCheckin(transcriptText: string): HealthCheckin {
  const normalized = transcriptText.toLowerCase();
  const stressScore = normalized.includes("stress") || normalized.includes("anxious") || normalized.includes("calm") ? 7 : 5;
  const sleepMinutes = normalized.includes("sleep") || normalized.includes("tired") ? 390 : 420;
  const focusScore = normalized.includes("focus") || normalized.includes("attention") || normalized.includes("brain") ? 52 : 58;

  return {
    checkinId: `brain-coach-${generateRequestId()}`,
    userId: "demo_001",
    localDate: new Date().toISOString().slice(0, 10),
    schemaVersion: "health-checkin-v1",
    source: "voice_confirmed",
    capturedAt: new Date().toISOString(),
    sleepQualityScore: 62,
    sleepMinutes,
    stressScore,
    moodScore: 6,
    focusScore,
    confirmedNote: transcriptText,
    sourceSegmentIds: [],
  };
}

function ensureBrainTraining(answer: AdviceOutput): AdviceOutput {
  if (answer.safetyLevel !== "green") return answer;
  if (answer.adviceItems.some((item) => item.actionType === "brain_training")) return answer;
  const brainTrainingItem: AdviceItem = {
    title: "Try a 3-minute attention reset",
    reason: "A short reaction-time task gives SleepOS a simple focus signal for today.",
    actionType: "brain_training",
    routineKey: null,
    durationMinutes: 3,
    riskLevel: "low",
  };

  return {
    ...answer,
    adviceItems: [brainTrainingItem, ...answer.adviceItems].slice(0, 3),
    speakableText:
      `Try a 3-minute attention reset first. ${answer.summary}. SleepOS provides wellness information and does not replace professional medical advice.`,
  };
}

function buildOutOfScopeAnswer(transcriptText: string): AdviceOutput {
  return {
    adviceRunId: generateRequestId(),
    status: "succeeded",
    safetyLevel: "green",
    safetyReasonCodes: [],
    summary: "Ask about brain training, sleep, focus, or stress.",
    observations: [
      {
        statement: "The question was outside the Voice Brain Coach demo scope.",
        evidenceMetricKeys: [],
        uncertainty: "SleepOS is limited to wellness guidance in this demo.",
      },
    ],
    adviceItems: [
      {
        title: "Try a focus question",
        reason: "The coach is scoped to brain training, sleep, stress, and focus wellness questions.",
        actionType: "brain_training",
        routineKey: null,
        durationMinutes: 3,
        riskLevel: "low",
      },
    ],
    brainDomains: [
      {
        key: "attention",
        score: 58,
        source: "self_report",
        measured: false,
        explanation: "Default demo attention context, not a clinical measurement.",
      },
    ],
    sourceIds: ["sleepos-brain-training-context-en-v1"],
    followUpQuestion: "Ask: what brain training should I do if I feel unfocused?",
    escalation: null,
    speakableText:
      `I can answer brain training, sleep, focus, and stress wellness questions. I heard: ${transcriptText}. SleepOS provides wellness information and does not replace professional medical advice.`,
    provenance: {
      promptVersion: "brain-coach-scope-v1",
      knowledgeVersion: "kb-en-2026-08-19-draft",
      safetyReasonCodes: [],
      adviceProviderKey: "mock",
    },
  };
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let body: BrainCoachRequest;
  try {
    const parsed = parseJsonBody<BrainCoachRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }

  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  const transcriptText = typeof body.transcriptText === "string" ? body.transcriptText.trim() : "";
  if (transcriptText.length < 3) {
    return failure("VALIDATION_ERROR", "transcriptText is required.", 400, requestId);
  }

  const answer = isInBrainCoachScope(transcriptText)
    ? ensureBrainTraining(await runAdvicePipeline({ transcriptText, checkin: buildCoachCheckin(transcriptText) }))
    : buildOutOfScopeAnswer(transcriptText);

  const response: BrainCoachResponse = {
    transcriptText,
    answer,
    recommendedTrainingHref: "/plan?start=brain-training",
  };
  return success(response, requestId);
}
