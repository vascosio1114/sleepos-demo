import { NextRequest } from "next/server";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../_lib/responses";
import { applyScenarioCheckin, findScenario } from "../_lib/scenarios";
import { runAdvicePipeline } from "../_lib/advice-pipeline";
import type { HealthCheckin } from "../_lib/types";

interface RunRequest {
  checkinId: string;
  sessionId: string | null;
  transcriptText?: string;
  idempotencyKey: string;
}

function emptyCheckin(checkinId: string): HealthCheckin {
  return {
    checkinId,
    userId: "demo_001",
    localDate: new Date().toISOString().slice(0, 10),
    schemaVersion: "health-checkin-v1",
    source: "voice_confirmed",
    capturedAt: new Date().toISOString(),
    sleepQualityScore: null,
    sleepMinutes: null,
    stressScore: null,
    moodScore: null,
    focusScore: null,
    confirmedNote: null,
    sourceSegmentIds: [],
  };
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let body: RunRequest;
  try {
    const parsed = parseJsonBody<RunRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }
  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  if (!body.checkinId || typeof body.checkinId !== "string") {
    return failure("VALIDATION_ERROR", "checkinId is required.", 400, requestId);
  }

  const baseCheckin = emptyCheckin(body.checkinId);
  let transcriptText = body.transcriptText ?? "";

  if (body.sessionId && typeof body.sessionId === "string" && body.sessionId.startsWith("scenario:")) {
    const scenarioId = body.sessionId.slice("scenario:".length);
    const scenario = findScenario(scenarioId);
    if (scenario) {
      const seeded: HealthCheckin = applyScenarioCheckin(scenarioId, baseCheckin);
      if (typeof body.transcriptText !== "string") {
        transcriptText = scenario.transcript.map((s) => s.text).join(" ");
      }
      const advice = await runAdvicePipeline({ transcriptText, checkin: seeded });
      return success(advice, requestId);
    }
  }

  const advice = await runAdvicePipeline({ transcriptText, checkin: baseCheckin });
  return success(advice, requestId);
}