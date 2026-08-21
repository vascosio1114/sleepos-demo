// Client-side localStorage repository for voice sessions, checkins, advice runs.
// Mirrors the Phase 0 contract storage keys (docs/SHARED_KEYS.md §9).

import type { AdviceOutput, BrainScoreSnapshot, HealthCheckin, TranscriptResult, VoiceSession, VoiceSessionState } from "./types";
import { buildSeedBrainSnapshot, cryptoRandomUUID } from "./safety";
import { isStoredShape } from "./safety-store-helpers";

const VOICE_KEY = "sleepos.voice.v1";
const CHECKIN_KEY = "sleepos.checkins.v1";
const ADVICE_KEY = "sleepos.advice.v1";
const BRAIN_KEY = "sleepos.brain-scores.v1";

interface VoiceSnapshot {
  version: 1;
  sessions: VoiceSession[];
  transcripts: Record<string, TranscriptResult>;
  activeSessionId: string | null;
}

interface CheckinSnapshot {
  version: 1;
  checkins: HealthCheckin[];
  lastCheckinId: string | null;
}

interface AdviceSnapshot {
  version: 1;
  runs: AdviceOutput[];
  lastRunId: string | null;
}

interface BrainSnapshot {
  version: 1;
  snapshots: BrainScoreSnapshot[];
  currentSnapshotId: string | null;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadVoiceSnapshot(): VoiceSnapshot {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(VOICE_KEY) : null;
  const parsed = safeParse<VoiceSnapshot>(raw);
  if (parsed && isStoredShape.voice(parsed)) return parsed;
  return { version: 1, sessions: [], transcripts: {}, activeSessionId: null };
}

function saveVoiceSnapshot(snapshot: VoiceSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOICE_KEY, JSON.stringify(snapshot));
  } catch {
    /* storage may be unavailable; demo continues */
  }
}

function loadCheckinSnapshot(): CheckinSnapshot {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(CHECKIN_KEY) : null;
  const parsed = safeParse<CheckinSnapshot>(raw);
  if (parsed && isStoredShape.checkin(parsed)) return parsed;
  return { version: 1, checkins: [], lastCheckinId: null };
}

function saveCheckinSnapshot(snapshot: CheckinSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHECKIN_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

function loadAdviceSnapshot(): AdviceSnapshot {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(ADVICE_KEY) : null;
  const parsed = safeParse<AdviceSnapshot>(raw);
  if (parsed && isStoredShape.advice(parsed)) return parsed;
  return { version: 1, runs: [], lastRunId: null };
}

function saveAdviceSnapshot(snapshot: AdviceSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADVICE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

function loadBrainSnapshot(): BrainSnapshot {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(BRAIN_KEY) : null;
  const parsed = safeParse<BrainSnapshot>(raw);
  if (parsed && isStoredShape.brain(parsed)) return parsed;
  return seedBrainSnapshot();
}

function saveBrainSnapshot(snapshot: BrainSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRAIN_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

function seedBrainSnapshot(): BrainSnapshot {
  const seed = buildSeedBrainSnapshot("demo_001");
  return { version: 1, snapshots: [seed], currentSnapshotId: seed.snapshotId };
}

export const voiceStore = {
  load(): VoiceSnapshot {
    return loadVoiceSnapshot();
  },
  save(snapshot: VoiceSnapshot): void {
    saveVoiceSnapshot(snapshot);
  },
  newSession(input: { language: VoiceSession["language"]; userId: string }): VoiceSession {
    const snapshot = loadVoiceSnapshot();
    const session: VoiceSession = {
      sessionId: cryptoRandomUUID(),
      userId: input.userId,
      state: "requested",
      sttProviderKey: "mock",
      providerMode: "mock",
      language: input.language,
      audioRetention: "none",
      startedAt: new Date().toISOString(),
      completedAt: null,
      abandonedAt: null,
      durationSeconds: null,
      confirmedSegmentCount: 0,
      flaggedSegmentCount: 0,
      schemaVersion: "voice-session-v1",
    };
    snapshot.sessions = [session, ...snapshot.sessions].slice(0, 50);
    snapshot.activeSessionId = session.sessionId;
    saveVoiceSnapshot(snapshot);
    return session;
  },
  updateSession(sessionId: string, patch: Partial<VoiceSession>): VoiceSession | null {
    const snapshot = loadVoiceSnapshot();
    const index = snapshot.sessions.findIndex((s) => s.sessionId === sessionId);
    if (index < 0) return null;
    const next: VoiceSession = { ...snapshot.sessions[index], ...patch };
    snapshot.sessions[index] = next;
    saveVoiceSnapshot(snapshot);
    return next;
  },
  setState(sessionId: string, state: VoiceSessionState): VoiceSession | null {
    const patch: Partial<VoiceSession> = { state };
    if (state === "completed") patch.completedAt = new Date().toISOString();
    if (state === "abandoned") patch.abandonedAt = new Date().toISOString();
    return voiceStore.updateSession(sessionId, patch);
  },
  saveTranscript(sessionId: string, transcript: TranscriptResult): TranscriptResult {
    const snapshot = loadVoiceSnapshot();
    snapshot.transcripts[sessionId] = transcript;
    saveVoiceSnapshot(snapshot);
    return transcript;
  },
  getTranscript(sessionId: string): TranscriptResult | null {
    const snapshot = loadVoiceSnapshot();
    return snapshot.transcripts[sessionId] ?? null;
  },
  deleteSession(sessionId: string): void {
    const snapshot = loadVoiceSnapshot();
    snapshot.sessions = snapshot.sessions.filter((s) => s.sessionId !== sessionId);
    delete snapshot.transcripts[sessionId];
    if (snapshot.activeSessionId === sessionId) snapshot.activeSessionId = null;
    saveVoiceSnapshot(snapshot);
  },
  clearAll(): void {
    saveVoiceSnapshot({ version: 1, sessions: [], transcripts: {}, activeSessionId: null });
  },
};

export const checkinStore = {
  load(): CheckinSnapshot {
    return loadCheckinSnapshot();
  },
  save(checkin: HealthCheckin): HealthCheckin {
    const snapshot = loadCheckinSnapshot();
    snapshot.checkins = [checkin, ...snapshot.checkins.filter((c) => c.checkinId !== checkin.checkinId)].slice(0, 50);
    snapshot.lastCheckinId = checkin.checkinId;
    saveCheckinSnapshot(snapshot);
    return checkin;
  },
  get(checkinId: string): HealthCheckin | null {
    return loadCheckinSnapshot().checkins.find((c) => c.checkinId === checkinId) ?? null;
  },
  latest(): HealthCheckin | null {
    const snapshot = loadCheckinSnapshot();
    return snapshot.checkins[0] ?? null;
  },
  clearAll(): void {
    saveCheckinSnapshot({ version: 1, checkins: [], lastCheckinId: null });
  },
};

export const adviceStore = {
  load(): AdviceSnapshot {
    return loadAdviceSnapshot();
  },
  save(run: AdviceOutput): AdviceOutput {
    const snapshot = loadAdviceSnapshot();
    snapshot.runs = [run, ...snapshot.runs.filter((r) => r.adviceRunId !== run.adviceRunId)].slice(0, 50);
    snapshot.lastRunId = run.adviceRunId;
    saveAdviceSnapshot(snapshot);
    return run;
  },
  get(runId: string): AdviceOutput | null {
    return loadAdviceSnapshot().runs.find((r) => r.adviceRunId === runId) ?? null;
  },
  latest(): AdviceOutput | null {
    const snapshot = loadAdviceSnapshot();
    return snapshot.runs[0] ?? null;
  },
  clearAll(): void {
    saveAdviceSnapshot({ version: 1, runs: [], lastRunId: null });
  },
};

export const brainStore = {
  load(): BrainSnapshot {
    return loadBrainSnapshot();
  },
  save(snapshot: BrainScoreSnapshot): BrainScoreSnapshot {
    const store = loadBrainSnapshot();
    store.snapshots = [snapshot, ...store.snapshots.filter((s) => s.snapshotId !== snapshot.snapshotId)].slice(0, 30);
    store.currentSnapshotId = snapshot.snapshotId;
    saveBrainSnapshot(store);
    return snapshot;
  },
  current(): BrainScoreSnapshot | null {
    const store = loadBrainSnapshot();
    return store.snapshots.find((s) => s.snapshotId === store.currentSnapshotId) ?? store.snapshots[0] ?? null;
  },
  history(): BrainScoreSnapshot[] {
    return loadBrainSnapshot().snapshots;
  },
  clearAll(): void {
    saveBrainSnapshot(seedBrainSnapshot());
  },
};

export const STORAGE_KEYS = {
  voice: VOICE_KEY,
  checkin: CHECKIN_KEY,
  advice: ADVICE_KEY,
  brain: BRAIN_KEY,
} as const;