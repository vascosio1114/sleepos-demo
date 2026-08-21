// Browser-side fetch wrappers for /api/v1/* routes.
// Mirrors the Phase 0 API.md §11 envelope contract.

// crypto.randomUUID via globalThis (browser has it natively, server has it too)
import type {
  AdviceOutput,
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  BrainScoreSnapshot,
  HealthCheckin,
  SpeakableAudio,
  TranscriptResult,
  VoiceSession,
  VoiceSessionConfig,
} from "./types";

async function request<T>(input: string, init: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const json = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
  if ("error" in json) {
    const message = json.error.message;
    const error: Error & { code?: string; status?: number } = new Error(message);
    error.code = json.error.code;
    error.status = response.status;
    throw error;
  }
  return json.data;
}

interface AdviceRunRequest {
  checkinId: string;
  sessionId: string | null;
  transcriptText?: string;
}

interface BrainCoachResponse {
  transcriptText: string;
  answer: AdviceOutput;
  recommendedTrainingHref: string;
}

export const voiceAdviceApi = {
  async openSession(input: { language: VoiceSession["language"]; userId: string }): Promise<{ session: VoiceSession; config: VoiceSessionConfig }> {
    return request(`/api/v1/voice/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: input.language, userId: input.userId, idempotencyKey: (globalThis.crypto ?? crypto).randomUUID() }),
    });
  },
  async finishSession(input: { sessionId: string; scenarioId?: string; audioDurationSeconds?: number; pcmBytesBase64?: string; sampleRateHz?: number }): Promise<{ session: VoiceSession; transcript: TranscriptResult }> {
    return request(`/api/v1/voice/sessions/${input.sessionId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: input.scenarioId,
        audioDurationSeconds: input.audioDurationSeconds,
        pcmBytesBase64: input.pcmBytesBase64,
        sampleRateHz: input.sampleRateHz,
        idempotencyKey: (globalThis.crypto ?? crypto).randomUUID(),
      }),
    });
  },
  async confirmTranscript(input: { sessionId: string; segments: TranscriptResult["segments"] }): Promise<{ session: VoiceSession }> {
    return request(`/api/v1/voice/sessions/${input.sessionId}/transcript`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments: input.segments, idempotencyKey: (globalThis.crypto ?? crypto).randomUUID() }),
    });
  },
  async saveCheckin(input: Omit<HealthCheckin, "checkinId">): Promise<HealthCheckin> {
    return request(`/api/v1/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, idempotencyKey: (globalThis.crypto ?? crypto).randomUUID() }),
    });
  },
  async getCheckin(checkinId: string): Promise<HealthCheckin> {
    return request(`/api/v1/checkins/${checkinId}`, { method: "GET" });
  },
  async runAdvice(input: AdviceRunRequest): Promise<AdviceOutput> {
    return request(`/api/v1/advice-runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, idempotencyKey: (globalThis.crypto ?? crypto).randomUUID() }),
    });
  },
  async runBrainCoach(input: { transcriptText: string }): Promise<BrainCoachResponse> {
    return request(`/api/v1/brain-coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcriptText: input.transcriptText, idempotencyKey: (globalThis.crypto ?? crypto).randomUUID() }),
    });
  },
  async getAdvice(adviceRunId: string): Promise<AdviceOutput> {
    return request(`/api/v1/advice-runs/${adviceRunId}`, { method: "GET" });
  },
  async synthesizeSpeech(input: { adviceRunId: string; rate?: number }): Promise<SpeakableAudio> {
    return request(`/api/v1/advice-runs/${input.adviceRunId}/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate: input.rate ?? 1, idempotencyKey: (globalThis.crypto ?? crypto).randomUUID() }),
    });
  },
  async currentBrainScore(): Promise<BrainScoreSnapshot | null> {
    try {
      return await request(`/api/v1/brain-scores/current`, { method: "GET" });
    } catch (error) {
      if (error instanceof Error && (error as Error & { code?: string }).code === "NOT_FOUND") return null;
      throw error;
    }
  },
  async brainScoreHistory(): Promise<BrainScoreSnapshot[]> {
    return request(`/api/v1/brain-scores/history?limit=30`, { method: "GET" });
  },
};
