// Mock SpeechToTextProvider. Returns an empty transcript; the
// check-in experience currently uses canned scenario transcripts
// from the API route. This adapter exists for factory symmetry with
// the live Google adapter.

import { randomUUID } from "node:crypto";
import type {
  AudioChunk,
  SpeechSession,
  SpeechSessionConfig,
  SpeechToTextProvider,
  TranscriptResultLocal,
  TranscriptSegmentLocal,
} from "./provider-types";

export class MockSpeechToTextProvider implements SpeechToTextProvider {
  readonly providerKey = "mock" as const;
  private readonly sessions = new Map<string, SpeechSession>();

  async startSession(input: SpeechSessionConfig): Promise<SpeechSession> {
    const session: SpeechSession = {
      sessionId: input.sessionId,
      language: input.language,
      startedAt: input.startedAt,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  async transcribeChunk(input: AudioChunk): Promise<TranscriptSegmentLocal> {
    if (!this.sessions.has(input.sessionId)) {
      throw new Error(`Unknown mock STT session: ${input.sessionId}`);
    }
    return {
      segmentId: randomUUID(),
      text: "",
      language: "en-US",
      confidence: 0,
      startedAtMs: 0,
      endedAtMs: 0,
      isConfirmed: false,
      userEdited: false,
    };
  }

  async finishSession(sessionId: string): Promise<TranscriptResultLocal> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Unknown mock STT session: ${sessionId}`);
    }
    this.sessions.delete(sessionId);
    return {
      sessionId,
      segments: [],
      language: "en-US",
      finalizedAt: new Date().toISOString(),
    };
  }
}