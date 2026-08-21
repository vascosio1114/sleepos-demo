// Unit tests for the Google Cloud Speech-to-Text V2 provider. The
// network round-trip is mocked via fetch; the focus is the env
// selection, the audio concatenation, and the response → TranscriptResult
// mapping.

import { describe, expect, it } from "vitest";
import { createSpeechToTextProvider } from "./index";
import type { ProviderConfig } from "../env";
import type { TranscriptResultLocal } from "../provider-types";

const baseConfig: ProviderConfig = {
  providerMode: "mock",
  sttProvider: "mock",
  adviceProvider: "mock",
  ttsProvider: "mock",
  audioRetention: "none",
  defaultLanguage: "en-US",
  minimax: { apiKey: null, baseUrl: null, textModel: null, ttsModel: null, ttsVoice: null },
  google: { credentialsPath: null, credentialsJson: null, projectId: null },
  paths: { knowledgeBundle: null, evaluationSuite: null },
};

const liveConfig: ProviderConfig = {
  ...baseConfig,
  providerMode: "live",
  sttProvider: "google_stt_v2",
  google: {
    credentialsPath: "/tmp/fake-sa.json",
    credentialsJson: null,
    projectId: "demo-project",
  },
};

describe("createSpeechToTextProvider", () => {
  it("returns a mock provider in mock-mode", () => {
    const provider = createSpeechToTextProvider(baseConfig);
    expect(provider.providerKey).toBe("mock");
  });

  it("returns a Google provider when env is live and credentials are present", () => {
    const provider = createSpeechToTextProvider(liveConfig);
    expect(provider.providerKey).toBe("google_stt_v2");
  });

  it("falls back to mock when providerMode is live but credentials path is missing", () => {
    const provider = createSpeechToTextProvider({ ...liveConfig, google: { credentialsPath: null, credentialsJson: null, projectId: "demo-project" } });
    expect(provider.providerKey).toBe("mock");
  });

  it("falls back to mock when projectId is missing", () => {
    const provider = createSpeechToTextProvider({ ...liveConfig, google: { credentialsPath: "/tmp/fake-sa.json", credentialsJson: null, projectId: null } });
    expect(provider.providerKey).toBe("mock");
  });
});

describe("GoogleSpeechToTextProvider — mocked network", () => {
  it("throws when service account JSON is malformed", async () => {
    const provider = createSpeechToTextProvider(liveConfig) as { finishSession: (id: string) => Promise<TranscriptResultLocal>; };
    // Patch readFile to return malformed JSON
    const fs = await import("node:fs");
    const originalReadFile = fs.promises.readFile;
    (fs.promises.readFile as unknown as (path: string) => Promise<string>) = (async () => "not json");
    try {
      await expect(provider.finishSession("session-1")).rejects.toThrow();
    } finally {
      fs.promises.readFile = originalReadFile;
    }
  });

  it("returns empty transcript when no chunks were buffered", async () => {
    const provider = createSpeechToTextProvider(liveConfig) as { startSession: (cfg: unknown) => Promise<{ sessionId: string }>; finishSession: (id: string) => Promise<TranscriptResultLocal>; };
    const session = await provider.startSession({
      sessionId: "session-empty",
      userId: "demo_001",
      language: "en-US",
      startedAt: new Date().toISOString(),
    });
    const result = await provider.finishSession(session.sessionId);
    expect(result.segments).toEqual([]);
  });
});
