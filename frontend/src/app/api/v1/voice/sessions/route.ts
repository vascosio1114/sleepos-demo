import { NextRequest } from "next/server";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../../_lib/responses";
import { defaultSessionConfig } from "../../_lib/mock-providers";
import { cryptoRandomUUID } from "../../_lib/safety";
import type { VoiceLanguage, VoiceSession } from "../../_lib/types";

interface OpenRequest {
  language: VoiceLanguage;
  userId?: string;
  audioRetention?: "none" | "enabled_storage" | "research_grant";
  idempotencyKey: string;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let body: OpenRequest;
  try {
    const parsed = parseJsonBody<OpenRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }

  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  if (body.language !== "en-US" && body.language !== "en-GB") {
    return failure("LANGUAGE_NOT_ENABLED", "Only en-US and en-GB are enabled in MVP.", 400, requestId);
  }

  const now = new Date().toISOString();
  const session: VoiceSession = {
    sessionId: cryptoRandomUUID(),
    userId: body.userId ?? "demo_001",
    state: "requested",
    sttProviderKey: "mock",
    providerMode: "mock",
    language: body.language,
    audioRetention: body.audioRetention ?? "none",
    startedAt: now,
    completedAt: null,
    abandonedAt: null,
    durationSeconds: null,
    confirmedSegmentCount: 0,
    flaggedSegmentCount: 0,
    schemaVersion: "voice-session-v1",
  };

  return success({ session, config: defaultSessionConfig() }, requestId);
}