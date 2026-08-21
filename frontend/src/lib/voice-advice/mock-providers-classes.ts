// Mock provider classes that implement the provider interfaces.
// The existing `mock-providers.ts` exports functional helpers; this
// file wraps them in class form for symmetry with the live adapters.

import type {
  AdviceDraft,
  AdviceProvider,
  SpeakableAdvice,
  SpeakableAudio,
  TextToSpeechProvider,
  ValidatedAdviceInput,
} from "./provider-types";
import { buildSafeFallbackAdvice, classifySafety, cryptoRandomUUID } from "./safety";
import { buildSpeakableAudio as buildBrowserTtsMeta, generateMockAdvice } from "./mock-providers";
import type { HealthCheckin } from "./types";

export class MockAdviceProvider implements AdviceProvider {
  readonly providerKey = "mock" as const;

  async generate(input: ValidatedAdviceInput): Promise<AdviceDraft> {
    const transcriptText = input.observations.map((o) => o.statement).join(" ");
    const safety = classifySafety({ transcriptText, checkin: input.checkin as unknown as HealthCheckin });
    if (safety.level === "red") {
      return buildSafeFallbackAdvice({
        adviceRunId: cryptoRandomUUID(),
        safetyLevel: "red",
        safetyReasonCodes: safety.reasonCodes,
      });
    }
    const checkinAsHealthCheckin: HealthCheckin = {
      checkinId: input.checkin.checkinId,
      userId: input.checkin.userId,
      localDate: input.localDate,
      schemaVersion: "health-checkin-v1",
      source: "voice_confirmed",
      capturedAt: input.checkin.capturedAt,
      sleepQualityScore: input.checkin.sleepQualityScore,
      sleepMinutes: input.checkin.sleepMinutes,
      stressScore: input.checkin.stressScore,
      moodScore: input.checkin.moodScore,
      focusScore: input.checkin.focusScore,
      confirmedNote: input.checkin.confirmedNote,
      sourceSegmentIds: [],
    };
    const output = generateMockAdvice({ adviceRunId: cryptoRandomUUID(), transcriptText, checkin: checkinAsHealthCheckin });
    return convertOutputToDraft(output);
  }
}

export class MockTextToSpeechProvider implements TextToSpeechProvider {
  readonly providerKey = "mock" as const;

  async synthesize(input: SpeakableAdvice): Promise<SpeakableAudio> {
    return buildBrowserTtsMeta(input.text);
  }
}

function convertOutputToDraft(output: import("./types").AdviceOutput): AdviceDraft {
  return {
    adviceRunId: output.adviceRunId,
    status: output.status,
    safetyLevel: output.safetyLevel,
    safetyReasonCodes: output.safetyReasonCodes,
    summary: output.summary,
    observations: output.observations,
    adviceItems: output.adviceItems.map((item) => ({
      title: item.title,
      reason: item.reason,
      actionType: item.actionType,
      routineKey: item.routineKey,
      durationMinutes: item.durationMinutes,
      riskLevel: item.riskLevel,
    })),
    brainDomains: output.brainDomains.map((d) => ({
      key: d.key,
      score: d.score,
      source: d.source,
      measured: d.measured,
      explanation: d.explanation,
    })),
    sourceIds: output.sourceIds,
    followUpQuestion: output.followUpQuestion,
    escalation: output.escalation,
    speakableText: output.speakableText,
    provenance: {
      promptVersion: output.provenance.promptVersion,
      knowledgeVersion: output.provenance.knowledgeVersion,
      safetyReasonCodes: output.provenance.safetyReasonCodes,
      adviceProviderKey: output.provenance.adviceProviderKey,
    },
  };
}