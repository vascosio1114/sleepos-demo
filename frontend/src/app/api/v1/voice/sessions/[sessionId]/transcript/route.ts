import { NextRequest } from "next/server";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../../../../_lib/responses";
import { cryptoRandomUUID } from "../../../../_lib/safety";
import type { TranscriptSegment, VoiceSession } from "../../../../_lib/types";

interface TranscriptConfirmRequest {
  segments: { segmentId: string; text: string; userEdited?: boolean; confidence?: number }[];
  idempotencyKey: string;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const requestId = generateRequestId();
  const { sessionId } = await params;
  if (!sessionId) return failure("VALIDATION_ERROR", "sessionId is required.", 400, requestId);

  let body: TranscriptConfirmRequest;
  try {
    const parsed = parseJsonBody<TranscriptConfirmRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }
  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  if (!Array.isArray(body.segments)) {
    return failure("VALIDATION_ERROR", "segments must be an array.", 400, requestId);
  }

  const segments: TranscriptSegment[] = body.segments.map((segment, index) => {
    if (typeof segment.text !== "string" || segment.text.length === 0 || segment.text.length > 240) {
      throw new Error(`segments[${index}].text invalid`);
    }
    return {
      segmentId: segment.segmentId || cryptoRandomUUID(),
      text: segment.text.trim(),
      language: "en-US",
      confidence: typeof segment.confidence === "number" ? segment.confidence : 1,
      startedAtMs: 0,
      endedAtMs: 0,
      isConfirmed: true,
      userEdited: Boolean(segment.userEdited),
    };
  });

  const session: VoiceSession = {
    sessionId,
    userId: "demo_001",
    state: "confirmed",
    sttProviderKey: "mock",
    providerMode: "mock",
    language: "en-US",
    audioRetention: "none",
    startedAt: new Date().toISOString(),
    completedAt: null,
    abandonedAt: null,
    durationSeconds: null,
    confirmedSegmentCount: segments.length,
    flaggedSegmentCount: 0,
    schemaVersion: "voice-session-v1",
  };

  return success({ session }, requestId);
}