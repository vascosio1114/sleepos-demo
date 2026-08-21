// Public surface for the voice / AI advice / brain score stream.
// Re-exports the canonical Phase 0 types and helpers so call sites only import from this module.

export * from "./types";
export {
  SAFETY_COPY,
  classifySafety,
  classifySegments,
  isProhibited,
  buildSafeFallbackAdvice,
  buildSeedBrainSnapshot,
  buildEmptyBrainSnapshot,
  synthesizeEscalation,
  validateAdviceOutput,
  cryptoRandomUUID,
} from "./safety";
export { DEMO_SCENARIOS, findScenario, scenariosByCategory } from "./scenarios";
export {
  defaultSessionConfig,
  generateMockAdvice,
  scenarioToTranscriptResult,
  buildSpeakableAudio,
} from "./mock-providers";
export { voiceStore, checkinStore, adviceStore, brainStore, STORAGE_KEYS } from "./store";
export { voiceAdviceApi } from "./api";
export { VoiceAdviceProvider, useVoiceAdvice, notifyVoiceAdviceStoreUpdated } from "./voice-advice-provider";
export { DOMAIN_INFO, REGION_INFO, CONSUMER_LAYER_DISCLAIMER } from "./brain-catalog";
export type { DomainInfo, RegionInfo } from "./brain-catalog";
export {
  PROVIDER_CONFIG_KEYS,
  PROVIDER_CONFIG_ALLOWLIST,
  loadProviderConfig,
  requireProviderConfig,
  redactConfig,
  ProviderConfigValidationError,
} from "./env";
export type {
  ProviderConfig,
  ProviderConfigError,
  ProviderConfigResult,
  EnvLike,
  ProviderMode,
  SttProviderKey,
  AdviceProviderKey,
  TtsProviderKey,
  VoiceAudioRetentionPolicy,
  VoiceLanguage,
} from "./env";
// NOTE: provider classes and factories are server-only. They import
// Node.js modules (node:fs, node:crypto) and must not be bundled into
// the client. API routes import them directly from
// `lib/voice-advice/providers`.
export type {
  SpeechToTextProvider,
  AdviceProvider,
  TextToSpeechProvider,
  ValidatedAdviceInput,
  ValidatedHealthCheckin,
  ValidatedObservation,
  AdviceDraft,
  SpeakableAdvice,
  SpeakableAudio,
  SpeechSessionConfig,
  SpeechSession,
  AudioChunk,
  TranscriptSegmentLocal,
  TranscriptResultLocal,
} from "./provider-types";
