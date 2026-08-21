// Provider factory + env-driven selection.
// Mock provider is the default; live adapters are selected only when
// `SLEEPOS_PROVIDER_MODE=live` AND the corresponding key is present.
// Any missing config falls back to mock.

import type { AdviceProvider, SpeechToTextProvider, TextToSpeechProvider } from "../provider-types";
import { MockAdviceProvider, MockTextToSpeechProvider } from "../mock-providers-classes";
import { MockSpeechToTextProvider } from "../mock-stt-provider";
import { MiniMaxAdviceProvider } from "./minimax-text";
import { MiniMaxTextToSpeechProvider } from "./minimax-tts";
import { GoogleSpeechToTextProvider } from "./google-speech";
import type { ProviderConfig } from "../env";

export function createAdviceProvider(config: ProviderConfig): AdviceProvider {
  if (config.providerMode === "live" && config.adviceProvider === "minimax" && config.minimax.apiKey && config.minimax.textModel) {
    return new MiniMaxAdviceProvider(config);
  }
  return new MockAdviceProvider();
}

export function createTextToSpeechProvider(config: ProviderConfig): TextToSpeechProvider {
  if (config.providerMode === "live" && config.ttsProvider === "minimax_tts" && config.minimax.apiKey && config.minimax.ttsModel && config.minimax.ttsVoice) {
    return new MiniMaxTextToSpeechProvider(config);
  }
  return new MockTextToSpeechProvider();
}

export function createSpeechToTextProvider(config: ProviderConfig): SpeechToTextProvider {
  if (
    config.providerMode === "live" &&
    config.sttProvider === "google_stt_v2" &&
    config.google.credentialsPath &&
    config.google.projectId
  ) {
    return new GoogleSpeechToTextProvider(config.google.credentialsPath, config.google.projectId);
  }
  return new MockSpeechToTextProvider();
}