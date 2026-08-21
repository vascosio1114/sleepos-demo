// Google Cloud Speech-to-Text V2 (v1 REST) provider.
// Implements the `SpeechToTextProvider` interface. Reads
// `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON path) + project
// id from env at construction; never persists the credentials.
// Auth: JWT-signed access token exchange against the service
// account's `token_uri`. Token is cached until ~5 minutes before
// expiry.
//
// SECURITY:
//   - Service account JSON is read from disk at construction; never
//     logged, never serialized into the request body, never included
//     in client bundles.
//   - Access token cached in process memory only.
//   - Audio is buffered in memory and POSTed once on finishSession.
//   - No PII in the request body aside from audio + language.
//
// PREREQUISITES (out of scope for the mock-mode demo):
//   1. Create a GCP service account with the "Speech Client" role.
//   2. Download the JSON key.
//   3. Set GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/key.json
//      and SLEEPOS_GOOGLE_STT_PROJECT_ID=your-project-id in .env.local.
//   4. Set SLEEPOS_STT_PROVIDER=google_stt_v2 to switch from mock.

import { createSign, createPrivateKey, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import type {
  AudioChunk,
  SpeechSession,
  SpeechSessionConfig,
  SpeechToTextProvider,
  TranscriptResultLocal,
  TranscriptSegmentLocal,
} from "../provider-types";
import type { VoiceLanguage } from "../types";

interface ServiceAccountJson {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

interface AccessTokenCache {
  token: string;
  expiresAt: number; // unix seconds
}

const STT_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_BUFFER_SECONDS = 300;

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function loadServiceAccount(path: string): Promise<ServiceAccountJson> {
  const raw = await fs.readFile(path, "utf8");
  const parsed = JSON.parse(raw) as ServiceAccountJson;
  if (parsed.type !== "service_account" || !parsed.private_key || !parsed.client_email || !parsed.token_uri) {
    throw new Error(`Service account JSON at ${path} is malformed.`);
  }
  return parsed;
}

async function exchangeAccessToken(sa: ServiceAccountJson, key: import("node:crypto").KeyObject): Promise<AccessTokenCache> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signatureInput);
  const sig = sign.sign(key);
  const sigBuf = Buffer.isBuffer(sig) ? sig : Buffer.from(sig);
  const signatureB64 = sigBuf.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+\$/,"");
  const jwt = `${signatureInput}.${signatureB64}`;

  const response = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Token exchange failed: ${response.status} ${text.slice(0, 200)}`);
  }
  const tokenResponse = (await response.json()) as { access_token: string; expires_in: number };
  return { token: tokenResponse.access_token, expiresAt: now + (tokenResponse.expires_in ?? 3600) };
}

interface GoogleRecognizeResponse {
  results?: Array<{
    alternatives?: Array<{
      transcript?: string;
      confidence?: number;
      words?: Array<{ startTime?: string; endTime?: string }>;
    }>;
  }>;
  totalBilledTime?: string;
}

interface SessionState {
  session: SpeechSession;
  chunks: Uint8Array[];
  language: VoiceLanguage;
  sampleRateHz: number;
}

export class GoogleSpeechToTextProvider implements SpeechToTextProvider {
  readonly providerKey = "google_stt_v2" as const;
  private readonly serviceAccountPath: string;
  private readonly projectId: string;
  private readonly sessions = new Map<string, SessionState>();
  private tokenCache: AccessTokenCache | null = null;
  private serviceAccount: ServiceAccountJson | null = null;
  private privateKeyCache: import("node:crypto").KeyObject | null = null;
  private loadingPromise: Promise<ServiceAccountJson> | null = null;

  constructor(serviceAccountPath: string, projectId: string) {
    this.serviceAccountPath = serviceAccountPath;
    this.projectId = projectId;
  }

  private async getServiceAccount(): Promise<ServiceAccountJson> {
    if (this.serviceAccount) return this.serviceAccount;
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = loadServiceAccount(this.serviceAccountPath);
    try {
      this.serviceAccount = await this.loadingPromise;
      return this.serviceAccount;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async getPrivateKey(): Promise<import("node:crypto").KeyObject> {
    if (this.privateKeyCache) return this.privateKeyCache;
    const sa = await this.getServiceAccount();
    this.privateKeyCache = createPrivateKey(sa.private_key);
    return this.privateKeyCache;
  }

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.tokenCache && this.tokenCache.expiresAt - now > TOKEN_REFRESH_BUFFER_SECONDS) {
      return this.tokenCache.token;
    }
    const sa = await this.getServiceAccount();
    const key = await this.getPrivateKey(); const fresh = await exchangeAccessToken(sa, key);
    this.tokenCache = fresh;
    return fresh.token;
  }

  async startSession(input: SpeechSessionConfig): Promise<SpeechSession> {
    const session: SpeechSession = {
      sessionId: input.sessionId,
      language: input.language,
      startedAt: input.startedAt,
    };
    // v1 REST LINEAR16 only supports specific sample rates. Default 16000.
    this.sessions.set(session.sessionId, {
      session,
      chunks: [],
      language: input.language,
      sampleRateHz: 16000,
    });
    return session;
  }

  async transcribeChunk(input: AudioChunk): Promise<TranscriptSegmentLocal> {
    const state = this.sessions.get(input.sessionId);
    if (!state) {
      throw new Error(`Unknown STT session: ${input.sessionId}`);
    }
    if (typeof input.sampleRateHz === "number" && Number.isFinite(input.sampleRateHz) && input.sampleRateHz >= 8000) {
      state.sampleRateHz = Math.round(input.sampleRateHz);
    }
    state.chunks.push(input.pcmBytes);
    return {
      segmentId: randomUUID(),
      text: "",
      language: state.language,
      confidence: 0,
      startedAtMs: 0,
      endedAtMs: 0,
      isConfirmed: false,
      userEdited: false,
    };
  }

  async finishSession(sessionId: string): Promise<TranscriptResultLocal> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Unknown STT session: ${sessionId}`);
    }
    this.sessions.delete(sessionId);

    const totalBytes = state.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const audioBuffer = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of state.chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    if (audioBuffer.byteLength === 0) {
      return {
        sessionId,
        segments: [],
        language: state.language,
        finalizedAt: new Date().toISOString(),
      };
    }

    const token = await this.getAccessToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STT_TIMEOUT_MS);
    try {
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            encoding: "LINEAR16",
            sampleRateHertz: state.sampleRateHz,
            languageCode: state.language,
            model: "latest_long",
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: false,
          },
          audio: { content: Buffer.from(audioBuffer).toString("base64") },
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Google STT error ${response.status}: ${text.slice(0, 200)}`);
      }
      const json = (await response.json()) as GoogleRecognizeResponse;
      const segments: TranscriptSegmentLocal[] = [];
      for (const result of json.results ?? []) {
        const alt = result.alternatives?.[0];
        if (!alt?.transcript) continue;
        const transcript = alt.transcript.trim();
        if (transcript.length === 0) continue;
        const words = alt.words ?? [];
        const startMsRaw = words[0]?.startTime;
        const endMsRaw = words[words.length - 1]?.endTime;
        const startTime = startMsRaw ? Math.round(parseFloat(startMsRaw.replace("s", "")) * 1000) : 0;
        const endTime = endMsRaw ? Math.round(parseFloat(endMsRaw.replace("s", "")) * 1000) : 0;
        segments.push({
          segmentId: randomUUID(),
          text: transcript,
          language: state.language,
          confidence: typeof alt.confidence === "number" ? alt.confidence : 0,
          startedAtMs: startTime,
          endedAtMs: endTime,
          isConfirmed: true,
          userEdited: false,
        });
      }
      return {
        sessionId,
        segments,
        language: state.language,
        finalizedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
