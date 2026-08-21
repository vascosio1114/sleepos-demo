// Provider configuration environment-variable names.
// Mirrored in docs/SHARED_KEYS.md §10 and ADR-002.
// Domain code reads these via the application bootstrapper, never
// via process.env directly inside domain modules.

import type {
  AdviceProviderKey,
  ProviderMode,
  SttProviderKey,
  TtsProviderKey,
  VoiceAudioRetentionPolicy,
  VoiceLanguage,
} from './voice-languages';

export interface ProviderConfigKeyMap {
  providerMode: 'SLEEPOS_PROVIDER_MODE';
  sttProvider: 'SLEEPOS_STT_PROVIDER';
  adviceProvider: 'SLEEPOS_ADVICE_PROVIDER';
  ttsProvider: 'SLEEPOS_TTS_PROVIDER';
  defaultLanguage: 'SLEEPOS_STT_DEFAULT_LANGUAGE';
  audioRetention: 'SLEEPOS_VOICE_AUDIO_RETENTION';
  googleCredentialsPath: 'GOOGLE_APPLICATION_CREDENTIALS';
  googleSttProjectId: 'SLEEPOS_GOOGLE_STT_PROJECT_ID';
  minimaxApiKey: 'MINIMAX_API_KEY';
  minimaxBaseUrl: 'MINIMAX_API_BASE_URL';
  minimaxTextModel: 'MINIMAX_TEXT_MODEL';
  minimaxTtsModel: 'MINIMAX_TTS_MODEL';
  minimaxTtsVoice: 'MINIMAX_TTS_VOICE';
  knowledgeBundlePath: 'SLEEPOS_KNOWLEDGE_BUNDLE_PATH';
  evaluationSuitePath: 'SLEEPOS_EVAL_SUITE_PATH';
}

export const PROVIDER_CONFIG_KEYS: ProviderConfigKeyMap = {
  providerMode: 'SLEEPOS_PROVIDER_MODE',
  sttProvider: 'SLEEPOS_STT_PROVIDER',
  adviceProvider: 'SLEEPOS_ADVICE_PROVIDER',
  ttsProvider: 'SLEEPOS_TTS_PROVIDER',
  defaultLanguage: 'SLEEPOS_STT_DEFAULT_LANGUAGE',
  audioRetention: 'SLEEPOS_VOICE_AUDIO_RETENTION',
  googleCredentialsPath: 'GOOGLE_APPLICATION_CREDENTIALS',
  googleSttProjectId: 'SLEEPOS_GOOGLE_STT_PROJECT_ID',
  minimaxApiKey: 'MINIMAX_API_KEY',
  minimaxBaseUrl: 'MINIMAX_API_BASE_URL',
  minimaxTextModel: 'MINIMAX_TEXT_MODEL',
  minimaxTtsModel: 'MINIMAX_TTS_MODEL',
  minimaxTtsVoice: 'MINIMAX_TTS_VOICE',
  knowledgeBundlePath: 'SLEEPOS_KNOWLEDGE_BUNDLE_PATH',
  evaluationSuitePath: 'SLEEPOS_EVAL_SUITE_PATH',
};

// Allowed values per key. The bootstrapper validates env at startup
// and fails fast if the configured value is not in the allowlist.
export const PROVIDER_CONFIG_ALLOWLIST = {
  providerMode: ['mock', 'live'] as ReadonlyArray<ProviderMode>,
  sttProvider: ['mock', 'google_stt_v2', 'gemini_live'] as ReadonlyArray<SttProviderKey>,
  adviceProvider: ['mock', 'minimax'] as ReadonlyArray<AdviceProviderKey>,
  ttsProvider: ['mock', 'minimax_tts'] as ReadonlyArray<TtsProviderKey>,
  audioRetention: ['none', 'enabled_storage', 'research_grant'] as ReadonlyArray<VoiceAudioRetentionPolicy>,
  defaultLanguage: ['en-US', 'en-GB'] as ReadonlyArray<VoiceLanguage>,
} as const;

// Provider secrets are server-only. The frontend bundle MUST never
// include any key with the `MINIMAX_API_KEY` shape; the build pipeline
// blocks `NEXT_PUBLIC_MINIMAX_*` env names outright.
export const SERVER_ONLY_PROVIDER_KEYS = [
  PROVIDER_CONFIG_KEYS.minimaxApiKey,
  PROVIDER_CONFIG_KEYS.googleCredentialsPath,
  PROVIDER_CONFIG_KEYS.googleSttProjectId,
  PROVIDER_CONFIG_KEYS.knowledgeBundlePath,
] as const;

export type ProviderConfigKey = keyof ProviderConfigKeyMap;