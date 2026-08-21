import { NextRequest } from "next/server";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../../../_lib/responses";
import { synthesizeSpeechForRun } from "../../../_lib/advice-pipeline";
import { SAFETY_COPY } from "../../../_lib/safety";

interface SpeechRequest {
  rate?: number;
  text?: string;
  idempotencyKey: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ adviceRunId: string }> }) {
  const requestId = generateRequestId();
  const { adviceRunId } = await params;
  if (!adviceRunId) return failure("VALIDATION_ERROR", "adviceRunId is required.", 400, requestId);

  let body: SpeechRequest;
  try {
    const parsed = parseJsonBody<SpeechRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }
  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  const text = typeof body.text === "string" && body.text.length > 0 ? body.text : SAFETY_COPY.wellnessScope.text;
  const audio = await synthesizeSpeechForRun({ text, rate: body.rate ?? 1 });
  return success(audio, requestId);
}