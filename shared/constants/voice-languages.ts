// Voice language configuration.
// MVP primary: en-US. Other locales are reserved for future markets
// and are not enabled by default.

export const VOICE_LANGUAGES = [
  'en-US',
  'en-GB',
  // Reserved; not enabled in MVP. Adapter may be configured to use
  // these codes, but the UI surfaces them only after product + privacy
  // approval for the target region.
  'zh-HK',
  'yue-Hant-HK',
] as const;
export type VoiceLanguage = (typeof VOICE_LANGUAGES)[number];

export const DEFAULT_VOICE_LANGUAGE: VoiceLanguage = 'en-US';

// BCP-47 codes match STT provider (Google Cloud Speech-to-Text V2
// `languageCode`). UI never concatenates these; always read from this
// constant so we can audit locale changes centrally.
export const VOICE_LANGUAGE_BCP47: Readonly<Record<VoiceLanguage, string>> = {
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'zh-HK': 'zh-HK',
  'yue-Hant-HK': 'yue-Hant-HK',
};

// Languages currently allowed in MVP build configuration. Anything
// outside this allowlist is rejected by config validation.
export const ENABLED_VOICE_LANGUAGES: ReadonlyArray<VoiceLanguage> = ['en-US', 'en-GB'];

// STT provider identifiers. Adding a new provider requires a new
// adapter implementing `SpeechToTextProvider` and an env-config
// entry in `provider-config-keys.ts`.
export const STT_PROVIDER_KEYS = [
  'mock',
  'google_stt_v2',
  'gemini_live',
] as const;
export type SttProviderKey = (typeof STT_PROVIDER_KEYS)[number];

// Advice provider identifiers. `mock` returns deterministic structured
// output; `minimax` (live) is only enabled after Phase 3 safety gates.
export const ADVICE_PROVIDER_KEYS = [
  'mock',
  'minimax',
] as const;
export type AdviceProviderKey = (typeof ADVICE_PROVIDER_KEYS)[number];

// TTS provider identifiers.
export const TTS_PROVIDER_KEYS = [
  'mock',
  'minimax_tts',
] as const;
export type TtsProviderKey = (typeof TTS_PROVIDER_KEYS)[number];

// Provider mode. `mock` runs the entire pipeline without external
// network calls; `live` requires all provider keys to be present.
export const PROVIDER_MODES = ['mock', 'live'] as const;
export type ProviderMode = (typeof PROVIDER_MODES)[number];

// Voice session lifecycle states.
export const VOICE_SESSION_STATES = [
  'requested',
  'opening',
  'recording',
  'transcribing',
  'awaiting_confirmation',
  'confirmed',
  'analyzing',
  'awaiting_advice',
  'speaking',
  'completed',
  'abandoned',
  'failed',
] as const;
export type VoiceSessionState = (typeof VOICE_SESSION_STATES)[number];

// Audio retention policies. Default is `none`; the other two
// require explicit consent + privacy review.
export const VOICE_AUDIO_RETENTION_POLICIES = ['none', 'enabled_storage', 'research_grant'] as const;
export type VoiceAudioRetentionPolicy = (typeof VOICE_AUDIO_RETENTION_POLICIES)[number];
export const DEFAULT_VOICE_AUDIO_RETENTION: VoiceAudioRetentionPolicy = 'none';

// Confidence threshold below which transcript segments are flagged
// for user confirmation rather than silently accepted.
export const TRANSCRIPT_LOW_CONFIDENCE_THRESHOLD = 0.78;

// Maximum transcript segment length (characters) before forcing a
// segment break. Keeps segments reviewable.
export const TRANSCRIPT_MAX_SEGMENT_LENGTH = 240;

// Maximum audio chunk size (bytes) accepted by the STT provider
// adapter. ~256 KiB; tune per provider payload limits.
export const MAX_AUDIO_CHUNK_BYTES = 256 * 1024;

// Maximum session audio duration (seconds). Hard cap regardless of
// client retry; server is authoritative.
export const MAX_VOICE_SESSION_SECONDS = 180;

// Default provider timeout for synchronous advice / TTS calls.
export const DEFAULT_PROVIDER_TIMEOUT_MS = 8000;