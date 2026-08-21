// Server-side helper for reading provider env config safely.
// Mirrors `shared/constants/provider-config-keys.ts`. Drift between
// the two files is the reviewer's job to catch (per Task 10 contract).
//
// SECURITY:
// - Never log or surface these values to the client.
// - All values are server-only. The Next.js build blocks any
//   `NEXT_PUBLIC_MINIMAX_*` or `NEXT_PUBLIC_GOOGLE_*` env names.

export type ProviderMode = "mock" | "live";
export type SttProviderKey = "mock" | "google_stt_v2" | "gemini_live";
export type AdviceProviderKey = "mock" | "minimax";
export type TtsProviderKey = "mock" | "minimax_tts";
export type VoiceAudioRetentionPolicy = "none" | "enabled_storage" | "research_grant";
export type VoiceLanguage = "en-US" | "en-GB" | "zh-HK" | "yue-Hant-HK";

export const PROVIDER_CONFIG_KEYS = {
  providerMode: "SLEEPOS_PROVIDER_MODE",
  sttProvider: "SLEEPOS_STT_PROVIDER",
  adviceProvider: "SLEEPOS_ADVICE_PROVIDER",
  ttsProvider: "SLEEPOS_TTS_PROVIDER",
  defaultLanguage: "SLEEPOS_STT_DEFAULT_LANGUAGE",
  audioRetention: "SLEEPOS_VOICE_AUDIO_RETENTION",
  googleCredentialsPath: "GOOGLE_APPLICATION_CREDENTIALS",
  googleSttProjectId: "SLEEPOS_GOOGLE_STT_PROJECT_ID",
  minimaxApiKey: "MINIMAX_API_KEY",
  minimaxBaseUrl: "MINIMAX_API_BASE_URL",
  minimaxTextModel: "MINIMAX_TEXT_MODEL",
  minimaxTtsModel: "MINIMAX_TTS_MODEL",
  minimaxTtsVoice: "MINIMAX_TTS_VOICE",
  knowledgeBundlePath: "SLEEPOS_KNOWLEDGE_BUNDLE_PATH",
  evaluationSuitePath: "SLEEPOS_EVAL_SUITE_PATH",
} as const;

export const PROVIDER_CONFIG_ALLOWLIST = {
  providerMode: ["mock", "live"] as ReadonlyArray<ProviderMode>,
  sttProvider: ["mock", "google_stt_v2", "gemini_live"] as ReadonlyArray<SttProviderKey>,
  adviceProvider: ["mock", "minimax"] as ReadonlyArray<AdviceProviderKey>,
  ttsProvider: ["mock", "minimax_tts"] as ReadonlyArray<TtsProviderKey>,
  audioRetention: ["none", "enabled_storage", "research_grant"] as ReadonlyArray<VoiceAudioRetentionPolicy>,
  defaultLanguage: ["en-US", "en-GB"] as ReadonlyArray<VoiceLanguage>,
} as const;

export interface ProviderConfig {
  providerMode: ProviderMode;
  sttProvider: SttProviderKey;
  adviceProvider: AdviceProviderKey;
  ttsProvider: TtsProviderKey;
  audioRetention: VoiceAudioRetentionPolicy;
  defaultLanguage: VoiceLanguage;
  minimax: {
    apiKey: string | null;
    baseUrl: string | null;
    textModel: string | null;
    ttsModel: string | null;
    ttsVoice: string | null;
  };
  google: {
    credentialsPath: string | null;
    projectId: string | null;
  };
  paths: {
    knowledgeBundle: string | null;
    evaluationSuite: string | null;
  };
}

export type ProviderConfigError =
  | { key: string; allowed: ReadonlyArray<string>; received: string }
  | { key: string; reason: "missing" };

export class ProviderConfigValidationError extends Error {
  readonly issues: ReadonlyArray<ProviderConfigError>;
  constructor(issues: ReadonlyArray<ProviderConfigError>) {
    super(`ProviderConfigValidationError: ${issues.length} issue(s)`);
    this.name = "ProviderConfigValidationError";
    this.issues = issues;
  }
}

export type ProviderConfigResult =
  | { ok: true; config: ProviderConfig }
  | { ok: false; issues: ReadonlyArray<ProviderConfigError> };

function pickEnum<K extends keyof typeof PROVIDER_CONFIG_ALLOWLIST>(
  key: K,
  raw: string | undefined,
  defaultValue: (typeof PROVIDER_CONFIG_ALLOWLIST)[K][number],
  issues: ProviderConfigError[],
): (typeof PROVIDER_CONFIG_ALLOWLIST)[K][number] {
  if (!raw || raw.length === 0) return defaultValue;
  const allowed = PROVIDER_CONFIG_ALLOWLIST[key] as ReadonlyArray<string>;
  if (!allowed.includes(raw)) {
    issues.push({ key, allowed, received: raw });
    return defaultValue;
  }
  return raw as (typeof PROVIDER_CONFIG_ALLOWLIST)[K][number];
}

function pickString(key: string, raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export type EnvLike = Readonly<Record<string, string | undefined>>;

export function loadProviderConfig(env: EnvLike = process.env): ProviderConfigResult {
  const issues: ProviderConfigError[] = [];
  const providerMode = pickEnum("providerMode", env[PROVIDER_CONFIG_KEYS.providerMode], "mock", issues);
  const sttProvider = pickEnum("sttProvider", env[PROVIDER_CONFIG_KEYS.sttProvider], "mock", issues);
  const adviceProvider = pickEnum("adviceProvider", env[PROVIDER_CONFIG_KEYS.adviceProvider], "mock", issues);
  const ttsProvider = pickEnum("ttsProvider", env[PROVIDER_CONFIG_KEYS.ttsProvider], "mock", issues);
  const audioRetention = pickEnum("audioRetention", env[PROVIDER_CONFIG_KEYS.audioRetention], "none", issues);
  const defaultLanguage = pickEnum("defaultLanguage", env[PROVIDER_CONFIG_KEYS.defaultLanguage], "en-US", issues);

  if (providerMode === "live") {
    if (!env[PROVIDER_CONFIG_KEYS.minimaxApiKey]) {
      issues.push({ key: PROVIDER_CONFIG_KEYS.minimaxApiKey, reason: "missing" });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    config: {
      providerMode,
      sttProvider,
      adviceProvider,
      ttsProvider,
      audioRetention,
      defaultLanguage,
      minimax: {
        apiKey: pickString(PROVIDER_CONFIG_KEYS.minimaxApiKey, env[PROVIDER_CONFIG_KEYS.minimaxApiKey]),
        baseUrl: pickString(PROVIDER_CONFIG_KEYS.minimaxBaseUrl, env[PROVIDER_CONFIG_KEYS.minimaxBaseUrl]),
        textModel: pickString(PROVIDER_CONFIG_KEYS.minimaxTextModel, env[PROVIDER_CONFIG_KEYS.minimaxTextModel]),
        ttsModel: pickString(PROVIDER_CONFIG_KEYS.minimaxTtsModel, env[PROVIDER_CONFIG_KEYS.minimaxTtsModel]),
        ttsVoice: pickString(PROVIDER_CONFIG_KEYS.minimaxTtsVoice, env[PROVIDER_CONFIG_KEYS.minimaxTtsVoice]),
      },
      google: {
        credentialsPath: pickString(PROVIDER_CONFIG_KEYS.googleCredentialsPath, env[PROVIDER_CONFIG_KEYS.googleCredentialsPath]),
        projectId: pickString(PROVIDER_CONFIG_KEYS.googleSttProjectId, env[PROVIDER_CONFIG_KEYS.googleSttProjectId]),
      },
      paths: {
        knowledgeBundle: pickString(PROVIDER_CONFIG_KEYS.knowledgeBundlePath, env[PROVIDER_CONFIG_KEYS.knowledgeBundlePath]),
        evaluationSuite: pickString(PROVIDER_CONFIG_KEYS.evaluationSuitePath, env[PROVIDER_CONFIG_KEYS.evaluationSuitePath]),
      },
    },
  };
}

// Throw at boot if the config is invalid. Server bootstrap calls this.
export function requireProviderConfig(env: EnvLike = process.env): ProviderConfig {
  const result = loadProviderConfig(env);
  if (!result.ok) {
    throw new ProviderConfigValidationError(result.issues);
  }
  return result.config;
}

// Redact any value that should never appear in logs.
export function redactConfig(config: ProviderConfig): Omit<ProviderConfig, "minimax"> & {
  minimax: Omit<ProviderConfig["minimax"], "apiKey"> & { apiKey: "REDACTED" | null };
} {
  return {
    ...config,
    minimax: {
      ...config.minimax,
      apiKey: config.minimax.apiKey ? "REDACTED" : null,
    },
  };
}