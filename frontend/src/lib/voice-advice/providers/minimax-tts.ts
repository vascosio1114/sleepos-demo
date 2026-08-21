// MiniMax text-to-speech provider.
// Implements the `TextToSpeechProvider` interface. Reads `MINIMAX_*`
// env at call time; never persists the key. Returns audio bytes as
// Uint8Array (PCM 16-bit or provider-specific format).
//
// SECURITY:
//   - API key read from process.env.MINIMAX_API_KEY only.
//   - Bounded timeout via AbortController (4s per A2A plan §11.6).
//   - Falls back to a zero-byte payload if the provider is unavailable.

import type { SpeakableAdvice, SpeakableAudio, TextToSpeechProvider } from "../provider-types";
import { buildSpeakableAudio as buildBrowserTtsMeta } from "../mock-providers";
import { type ProviderConfig } from "../env";

const TTS_TIMEOUT_MS = 4_000;

interface MiniMaxTtsRequest {
  model: string;
  text: string;
  voice_setting?: { voice_id?: string };
  audio_config?: { sample_rate?: number; bitrate?: number; format?: string };
  stream?: boolean;
}

interface MiniMaxTtsResponse {
  // Most MiniMax-compatible TTS APIs return either a JSON envelope with
  // a base64 audio payload, or a raw audio binary. We support both.
  data?: { audio?: string; audio_url?: string };
  audio?: string;
  audio_url?: string;
  mime_type?: string;
}

export class MiniMaxTextToSpeechProvider implements TextToSpeechProvider {
  readonly providerKey = "minimax_tts" as const;
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async synthesize(input: SpeakableAdvice): Promise<SpeakableAudio> {
    const apiKey = this.config.minimax.apiKey;
    const baseUrl = this.config.minimax.baseUrl ?? "https://api.minimaxi.com";
    const model = this.config.minimax.ttsModel;
    const voiceId = this.config.minimax.ttsVoice;
    if (!apiKey || !model || !voiceId) {
      return buildBrowserTtsMeta(input.text);
    }

    const body: MiniMaxTtsRequest = {
      model,
      text: input.text,
      voice_setting: { voice_id: voiceId },
      audio_config: { sample_rate: 16000, bitrate: 128000, format: "pcm" },
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/t2a_v2`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        return buildBrowserTtsMeta(input.text);
      }

      const contentType = response.headers.get("Content-Type") ?? "";
      let audioBytes: Uint8Array;
      let mimeType: string;

      if (contentType.includes("application/json")) {
        const json = (await response.json()) as MiniMaxTtsResponse;
        const base64 = json.data?.audio ?? json.audio ?? null;
        const audioUrl = json.data?.audio_url ?? json.audio_url ?? null;
        if (base64) {
          audioBytes = base64ToBytes(base64);
          mimeType = json.mime_type ?? "audio/pcm";
        } else if (audioUrl) {
          audioBytes = await fetchAudioFromUrl(audioUrl, controller.signal);
          mimeType = json.mime_type ?? "audio/mpeg";
        } else {
          return buildBrowserTtsMeta(input.text);
        }
      } else {
        audioBytes = new Uint8Array(await response.arrayBuffer());
        mimeType = contentType || "audio/pcm";
      }

      const durationMs = Math.max(800, Math.min(60_000, Math.round((input.text.length / 14) * 1000)));

      return {
        audioBytes,
        mimeType,
        durationMs,
        providerKey: "minimax_tts",
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return buildBrowserTtsMeta(input.text);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  // Browser fallback (used during unit tests if any).
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function fetchAudioFromUrl(url: string, signal: AbortSignal): Promise<Uint8Array> {
  const response = await fetch(url, { signal });
  return new Uint8Array(await response.arrayBuffer());
}