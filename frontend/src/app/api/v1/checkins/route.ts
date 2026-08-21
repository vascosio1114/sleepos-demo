import { NextRequest } from "next/server";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../_lib/responses";
import { cryptoRandomUUID } from "../_lib/safety";
import type { HealthCheckin } from "../_lib/types";

interface CheckinRequest {
  userId: string;
  localDate: string;
  schemaVersion: "health-checkin-v1";
  source: HealthCheckin["source"];
  capturedAt: string;
  sleepQualityScore: number | null;
  sleepMinutes: number | null;
  stressScore: number | null;
  moodScore: number | null;
  focusScore: number | null;
  confirmedNote: string | null;
  sourceSegmentIds: string[];
  idempotencyKey: string;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let body: CheckinRequest;
  try {
    const parsed = parseJsonBody<CheckinRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }

  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  if (!datePattern.test(body.localDate)) return failure("VALIDATION_ERROR", "localDate must be YYYY-MM-DD.", 400, requestId);
  if (body.schemaVersion !== "health-checkin-v1") return failure("VALIDATION_ERROR", "Unsupported schemaVersion.", 400, requestId);
  if (!["voice_confirmed", "manual_entry"].includes(body.source)) return failure("VALIDATION_ERROR", "Invalid source.", 400, requestId);

  function clampOrReject(name: string, value: unknown, min: number, max: number) {
    if (value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || !Number.isInteger(value)) {
      throw new Error(`${name} must be integer in [${min}, ${max}] or null.`);
    }
    return value;
  }

  let checkin: HealthCheckin;
  try {
    checkin = {
      checkinId: cryptoRandomUUID(),
      userId: body.userId,
      localDate: body.localDate,
      schemaVersion: "health-checkin-v1",
      source: body.source,
      capturedAt: body.capturedAt,
      sleepQualityScore: clampOrReject("sleepQualityScore", body.sleepQualityScore, 0, 100),
      sleepMinutes: clampOrReject("sleepMinutes", body.sleepMinutes, 0, 1440),
      stressScore: clampOrReject("stressScore", body.stressScore, 0, 10),
      moodScore: clampOrReject("moodScore", body.moodScore, 0, 10),
      focusScore: clampOrReject("focusScore", body.focusScore, 0, 100),
      confirmedNote: typeof body.confirmedNote === "string" && body.confirmedNote.length > 0 ? body.confirmedNote.slice(0, 600) : null,
      sourceSegmentIds: Array.isArray(body.sourceSegmentIds) ? body.sourceSegmentIds.slice(0, 64) : [],
    };
  } catch (error) {
    return failure("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid checkin.", 400, requestId);
  }

  return success(checkin, requestId);
}