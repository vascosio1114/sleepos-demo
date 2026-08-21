// Provider config env helper tests.

import { describe, expect, it } from "vitest";
import { loadProviderConfig, redactConfig, requireProviderConfig, ProviderConfigValidationError } from "./env";

describe("loadProviderConfig", () => {
  it("returns mock-mode defaults when env is empty", () => {
    const result = loadProviderConfig({});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.providerMode).toBe("mock");
    expect(result.config.sttProvider).toBe("mock");
    expect(result.config.adviceProvider).toBe("mock");
    expect(result.config.ttsProvider).toBe("mock");
    expect(result.config.audioRetention).toBe("none");
    expect(result.config.defaultLanguage).toBe("en-US");
    expect(result.config.minimax.apiKey).toBe(null);
  });

  it("flags live mode without MINIMAX_API_KEY", () => {
    const result = loadProviderConfig({
      SLEEPOS_PROVIDER_MODE: "live",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => "reason" in i && i.reason === "missing" && i.key === "MINIMAX_API_KEY")).toBe(true);
  });

  it("accepts valid enums", () => {
    const result = loadProviderConfig({
      SLEEPOS_PROVIDER_MODE: "mock",
      SLEEPOS_STT_PROVIDER: "google_stt_v2",
      SLEEPOS_ADVICE_PROVIDER: "minimax",
      SLEEPOS_TTS_PROVIDER: "minimax_tts",
      SLEEPOS_STT_DEFAULT_LANGUAGE: "en-GB",
      SLEEPOS_VOICE_AUDIO_RETENTION: "none",
      MINIMAX_API_KEY: "sk-test",
      MINIMAX_TEXT_MODEL: "minimax-text-01",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.sttProvider).toBe("google_stt_v2");
    expect(result.config.adviceProvider).toBe("minimax");
    expect(result.config.ttsProvider).toBe("minimax_tts");
    expect(result.config.defaultLanguage).toBe("en-GB");
    expect(result.config.minimax.apiKey).toBe("sk-test");
    expect(result.config.minimax.textModel).toBe("minimax-text-01");
  });

  it("flags out-of-allowlist enum values", () => {
    const result = loadProviderConfig({
      SLEEPOS_PROVIDER_MODE: "experimental",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => "received" in i && i.received === "experimental")).toBe(true);
  });
});

describe("requireProviderConfig", () => {
  it("throws ProviderConfigValidationError on live mode without key", () => {
    expect(() => requireProviderConfig({ SLEEPOS_PROVIDER_MODE: "live" })).toThrow(ProviderConfigValidationError);
  });

  it("returns config when valid", () => {
    const config = requireProviderConfig({});
    expect(config.providerMode).toBe("mock");
  });
});

describe("redactConfig", () => {
  it("replaces API key with REDACTED", () => {
    const result = loadProviderConfig({ MINIMAX_API_KEY: "sk-test-123" });
    if (!result.ok) throw new Error("expected ok");
    const redacted = redactConfig(result.config);
    expect(redacted.minimax.apiKey).toBe("REDACTED");
    expect(redacted.minimax.baseUrl).toBe(null);
  });

  it("keeps apiKey as null when absent", () => {
    const result = loadProviderConfig({});
    if (!result.ok) throw new Error("expected ok");
    const redacted = redactConfig(result.config);
    expect(redacted.minimax.apiKey).toBe(null);
  });
});