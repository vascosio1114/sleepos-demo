// Server-side advice pipeline that selects the configured provider
// (mock by default, MiniMax live when env is configured) and produces
// a strictly validated AdviceOutput. Used by /api/v1/advice-runs.

import type { AdviceOutput, HealthCheckin, SafetyClassification } from "./types";
import { classifySafety, buildSafeFallbackAdvice, isProhibited, validateAdviceOutput, cryptoRandomUUID } from "./safety";
import { generateMockAdvice } from "./mock-providers";
import { loadProviderConfig } from "../../../../lib/voice-advice/env";
import { createAdviceProvider, createTextToSpeechProvider } from "../../../../lib/voice-advice/providers";

export interface BuildAdviceInput {
  transcriptText: string;
  checkin: HealthCheckin;
}

export function buildSafetyClassification(input: { transcriptText: string; checkin: HealthCheckin }): SafetyClassification {
  return classifySafety({ transcriptText: input.transcriptText, checkin: input.checkin });
}

function getProviderConfig(): import("../../../../lib/voice-advice/env").ProviderConfig {
  // loadProviderConfig is allowed to fail (e.g. missing MINIMAX_API_KEY in live mode).
  // We still want the factory to return a provider (mock fallback) even on failure.
  const result = loadProviderConfig();
  if (result.ok) {
    const c = result.config;
    console.log("[advice-pipeline DEBUG] ok mode:", c.providerMode, "advice:", c.adviceProvider, "hasKey:", Boolean(c.minimax.apiKey), "model:", c.minimax.textModel);
    return c;
  }
  console.log("[advice-pipeline DEBUG] failed issues:", JSON.stringify(result.issues));
  console.log("[advice-pipeline DEBUG] process.env.SLEEPOS_PROVIDER_MODE:", process.env.SLEEPOS_PROVIDER_MODE);
  console.log("[advice-pipeline DEBUG] process.env.SLEEPOS_ADVICE_PROVIDER:", process.env.SLEEPOS_ADVICE_PROVIDER);
  console.log("[advice-pipeline DEBUG] process.env.MINIMAX_API_KEY present:", Boolean(process.env.MINIMAX_API_KEY));
  // Validation failed — fall back to mock-mode defaults.
  return {
    providerMode: "mock",
    sttProvider: "mock",
    adviceProvider: "mock",
    ttsProvider: "mock",
    audioRetention: "none",
    defaultLanguage: "en-US",
    minimax: {
      apiKey: null,
      baseUrl: null,
      textModel: null,
      ttsModel: null,
      ttsVoice: null,
    },
    google: { credentialsPath: null, projectId: null },
    paths: { knowledgeBundle: null, evaluationSuite: null },
  };
}

export async function runAdvicePipeline(input: BuildAdviceInput): Promise<AdviceOutput> {
  const safety = buildSafetyClassification(input);

  // Red-only path: never call the model.
  if (safety.level === "red") {
    return {
      ...buildSafeFallbackAdvice({
        adviceRunId: cryptoRandomUUID(),
        safetyLevel: "red",
        safetyReasonCodes: safety.reasonCodes,
      }),
      status: "succeeded",
    };
  }

  const provider = createAdviceProvider(getProviderConfig());

  try {
    const draft = await provider.generate({
      userId: input.checkin.userId,
      localDate: input.checkin.localDate,
      language: "en-US",
      checkin: input.checkin,
      observations: [],
      knowledgeChunkIds: [],
      allowedActionTypes: ["brain_training", "breathing", "sleep_goal", "routine"],
      maxSpeakableTextChars: 600,
      safetyClassification: safety,
      knowledgeVersion: "kb-empty-v0",
      promptVersion: "advice-prompt-minimax-v1",
    });
    const candidate: AdviceOutput = {
      adviceRunId: draft.adviceRunId,
      status: draft.status,
      safetyLevel: draft.safetyLevel,
      safetyReasonCodes: draft.safetyReasonCodes,
      summary: draft.summary,
      observations: draft.observations,
      adviceItems: draft.adviceItems,
      brainDomains: draft.brainDomains,
      sourceIds: draft.sourceIds,
      followUpQuestion: draft.followUpQuestion,
      escalation: draft.escalation,
      speakableText: draft.speakableText,
      provenance: draft.provenance,
    };
    const validation = validateAdviceOutput(candidate);
    if (!validation.valid) {
      return { ...generateMockAdvice({ adviceRunId: candidate.adviceRunId, transcriptText: input.transcriptText, checkin: input.checkin }), status: "failed_safe_fallback" };
    }
    const proseToCheck = [
      candidate.summary,
      candidate.speakableText,
      ...candidate.adviceItems.map((item) => `${item.title} ${item.reason}`),
    ];
    for (const text of proseToCheck) {
      if (isProhibited(text)) {
        return { ...generateMockAdvice({ adviceRunId: candidate.adviceRunId, transcriptText: input.transcriptText, checkin: input.checkin }), status: "failed_safe_fallback" };
      }
    }
    return candidate;
  } catch {
    return { ...generateMockAdvice({ adviceRunId: cryptoRandomUUID(), transcriptText: input.transcriptText, checkin: input.checkin }), status: "failed_safe_fallback" };
  }
}

export async function synthesizeSpeechForRun(input: { text: string; rate?: number }) {
  void input.rate;
  const provider = createTextToSpeechProvider(getProviderConfig());
  return provider.synthesize({ text: input.text, language: "en-US" });
}