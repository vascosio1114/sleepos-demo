import { NextRequest } from "next/server";
import { failure, generateRequestId, parseJsonBody, success, validateIdempotencyKey } from "../../../../_lib/responses";
import { scenarioToTranscriptResult } from "../../../../_lib/mock-providers";
import { findScenario } from "../../../../_lib/scenarios";
import { createSpeechToTextProvider } from "../../../../../../../lib/voice-advice/providers";
import { loadProviderConfig } from "../../../../../../../lib/voice-advice/env";
import type { TranscriptResult, VoiceSession } from "../../../../_lib/types";

interface FinishRequest {
  scenarioId?: string;
  audioDurationSeconds?: number;
  // Base64-encoded PCM 16-bit mono @ 16 kHz. Sent by the browser when
  // "Use my voice" path is chosen. The route forwards the bytes to
  // the configured SpeechToTextProvider.
  pcmBytesBase64?: string;
  // Sample rate of the captured PCM. The client captures at 16 kHz by
  // default; include it for the STT provider.
  sampleRateHz?: number;
  idempotencyKey: string;
}

const CANNED_TRANSCRIPT = [
  { text: "Yesterday I went to bed around midnight.", confidence: 0.9 },
  { text: "I slept about six and a half hours.", confidence: 0.86 },
  { text: "Stress has been pretty high this week.", confidence: 0.92 },
];

function nowIso(): string {
  return new Date().toISOString();
}

function buildCannedTranscript(sessionId: string): TranscriptResult {
  return scenarioToTranscriptResult({ sessionId, transcript: CANNED_TRANSCRIPT, language: "en-US" });
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const requestId = generateRequestId();
  const { sessionId } = await params;
  if (!sessionId) return failure("VALIDATION_ERROR", "sessionId is required.", 400, requestId);

  let body: FinishRequest;
  try {
    const parsed = parseJsonBody<FinishRequest>(await request.json());
    if (!parsed.ok) return failure("VALIDATION_ERROR", parsed.error, 400, requestId);
    body = parsed.body;
  } catch {
    return failure("VALIDATION_ERROR", "Request body must be valid JSON.", 400, requestId);
  }
  const idempotency = validateIdempotencyKey(body.idempotencyKey);
  if (!idempotency.ok) return failure("VALIDATION_ERROR", idempotency.error, 400, requestId);

  // Path 1: scenario transcript (current demo behaviour).
  if (body.scenarioId) {
    const scenario = findScenario(body.scenarioId);
    if (!scenario) return failure("VALIDATION_ERROR", `Unknown scenario '${body.scenarioId}'.`, 400, requestId);
    return success(
      {
        session: buildSession(sessionId, scenario.transcript),
        transcript: scenarioToTranscriptResult({ sessionId, transcript: scenario.transcript, language: "en-US" }),
      },
      requestId,
    );
  }

  // Path 2: real audio capture from the browser. Forward to STT.
  if (body.pcmBytesBase64 && body.pcmBytesBase64.length > 0) {
    const config = loadProviderConfig();
    if (config.ok) {
      const provider = createSpeechToTextProvider(config.config);
      const session: import("../../../../_lib/types").VoiceSession = {
        sessionId,
        userId: "demo_001",
        state: "awaiting_confirmation",
        sttProviderKey: provider.providerKey,
        providerMode: config.config.providerMode,
        language: "en-US",
        audioRetention: config.config.audioRetention,
        startedAt: nowIso(),
        completedAt: null,
        abandonedAt: null,
        durationSeconds: body.audioDurationSeconds ?? null,
        confirmedSegmentCount: 0,
        flaggedSegmentCount: 0,
        schemaVersion: "voice-session-v1",
      };
      const sessionResp = await provider.startSession({
        sessionId,
        userId: "demo_001",
        language: "en-US",
        startedAt: nowIso(),
      });
      void sessionResp;
      const pcm = decodeBase64ToBytes(body.pcmBytesBase64);
      // Feed the entire audio as a single chunk. Streaming is future work.
      await provider.transcribeChunk({
        sessionId,
        pcmBytes: pcm,
        capturedAt: nowIso(),
        sequence: 0,
        sampleRateHz: body.sampleRateHz ?? 16000,
      });
      const transcript = await provider.finishSession(sessionId);
      return success({ session, transcript }, requestId);
    }
    // No valid provider config: fall through to canned.
  }

  // Path 3: canned fallback (catches audio without scenarioId and
  // without provider config).
  return success(
    {
      session: buildSession(sessionId, CANNED_TRANSCRIPT),
      transcript: buildCannedTranscript(sessionId),
    },
    requestId,
  );
}

function buildSession(sessionId: string, transcript: { confidence: number }[]): VoiceSession {
  const flaggedCount = transcript.filter((s) => s.confidence < 0.78).length;
  const totalSeconds = Math.max(1, Math.round((transcript.at(-1)?.confidence ?? 1) * 5));
  return {
    sessionId,
    userId: "demo_001",
    state: "awaiting_confirmation",
    sttProviderKey: "mock",
    providerMode: "mock",
    language: "en-US",
    audioRetention: "none",
    startedAt: nowIso(),
    completedAt: null,
    abandonedAt: null,
    durationSeconds: totalSeconds,
    confirmedSegmentCount: 0,
    flaggedSegmentCount: flaggedCount,
    schemaVersion: "voice-session-v1",
  };
}
