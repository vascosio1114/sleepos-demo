"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AdviceOutput, BrainScoreSnapshot, HealthCheckin, TranscriptResult, VoiceSession } from "./types";
import { voiceStore, checkinStore, adviceStore, brainStore } from "./store";
import { voiceAdviceApi } from "./api";
import { classifySegments } from "./safety";

interface VoiceAdviceContext {
  isHydrated: boolean;
  voiceSessions: VoiceSession[];
  activeSession: VoiceSession | null;
  latestCheckin: HealthCheckin | null;
  latestAdvice: AdviceOutput | null;
  currentBrainScore: BrainScoreSnapshot | null;
  openSession: (input: { language: VoiceSession["language"]; userId: string }) => Promise<VoiceSession>;
  finishSession: (input: { sessionId: string; scenarioId?: string; audioDurationSeconds?: number }) => Promise<{ session: VoiceSession; transcript: TranscriptResult }>;
  confirmTranscript: (input: { sessionId: string; segments: TranscriptResult["segments"] }) => Promise<{ session: VoiceSession }>;
  saveCheckin: (input: Omit<HealthCheckin, "checkinId">) => Promise<HealthCheckin>;
  runAdvice: (input: { checkinId: string; sessionId: string | null; transcriptText?: string }) => Promise<AdviceOutput>;
  refreshBrainScore: () => Promise<BrainScoreSnapshot | null>;
  refreshLatestAdvice: () => void;
  deleteVoiceSession: (sessionId: string) => void;
  resetAll: () => void;
}

const Context = createContext<VoiceAdviceContext | null>(null);
const STORE_UPDATED_EVENT = "sleepos-voice-store-updated";

function loadInitialSessions(): VoiceSession[] {
  if (typeof window === "undefined") return [];
  return voiceStore.load().sessions;
}

function loadInitialLatestCheckin(): HealthCheckin | null {
  if (typeof window === "undefined") return null;
  return checkinStore.latest();
}

function loadInitialLatestAdvice(): AdviceOutput | null {
  if (typeof window === "undefined") return null;
  return adviceStore.latest();
}

function loadInitialBrainScore(): BrainScoreSnapshot | null {
  if (typeof window === "undefined") return null;
  return brainStore.current();
}

export function VoiceAdviceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>(loadInitialSessions);
  const [activeSession, setActiveSession] = useState<VoiceSession | null>(() => loadInitialSessions()[0] ?? null);
  const [latestCheckin, setLatestCheckin] = useState<HealthCheckin | null>(loadInitialLatestCheckin);
  const [latestAdvice, setLatestAdvice] = useState<AdviceOutput | null>(loadInitialLatestAdvice);
  const [currentBrainScore, setCurrentBrainScore] = useState<BrainScoreSnapshot | null>(loadInitialBrainScore);

  useEffect(() => {
    // Defer to a microtask so React does not flag cascading renders during hydration.
    queueMicrotask(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshFromStore = () => {
      const sessions = voiceStore.load().sessions;
      setVoiceSessions(sessions);
      setActiveSession(sessions[0] ?? null);
      setLatestCheckin(checkinStore.latest());
      setLatestAdvice(adviceStore.latest());
      setCurrentBrainScore(brainStore.current());
    };
    window.addEventListener(STORE_UPDATED_EVENT, refreshFromStore);
    return () => window.removeEventListener(STORE_UPDATED_EVENT, refreshFromStore);
  }, []);

  const openSession = useCallback(async (input: { language: VoiceSession["language"]; userId: string }) => {
    const session = voiceStore.newSession(input);
    setVoiceSessions(voiceStore.load().sessions);
    setActiveSession(session);
    return session;
  }, []);

  const finishSession = useCallback(async (input: { sessionId: string; scenarioId?: string; audioDurationSeconds?: number }) => {
    const result = await voiceAdviceApi.finishSession(input);
    voiceStore.saveTranscript(result.transcript.sessionId, result.transcript);
    const { flaggedIds } = classifySegments(result.transcript.segments, 0.78);
    const updated = voiceStore.updateSession(result.session.sessionId, {
      flaggedSegmentCount: flaggedIds.size,
      durationSeconds: Math.max(1, Math.round(((result.transcript.segments.at(-1)?.endedAtMs ?? 0) / 1000))),
      state: "awaiting_confirmation",
    });
    setVoiceSessions(voiceStore.load().sessions);
    setActiveSession(updated ?? result.session);
    return { session: updated ?? result.session, transcript: result.transcript };
  }, []);

  const confirmTranscript = useCallback(async (input: { sessionId: string; segments: TranscriptResult["segments"] }) => {
    const result = await voiceAdviceApi.confirmTranscript(input);
    const confirmed = voiceStore.updateSession(input.sessionId, {
      confirmedSegmentCount: input.segments.filter((segment) => segment.isConfirmed).length,
      state: "confirmed",
    });
    setVoiceSessions(voiceStore.load().sessions);
    setActiveSession(confirmed ?? result.session);
    return { session: confirmed ?? result.session };
  }, []);

  const saveCheckin = useCallback(async (input: Omit<HealthCheckin, "checkinId">) => {
    const saved = await voiceAdviceApi.saveCheckin(input);
    checkinStore.save(saved);
    setLatestCheckin(saved);
    return saved;
  }, []);

  const runAdvice = useCallback(async (input: { checkinId: string; sessionId: string | null; transcriptText?: string }) => {
    const advice = await voiceAdviceApi.runAdvice(input);
    adviceStore.save(advice);
    setLatestAdvice(advice);
    return advice;
  }, []);

  const refreshBrainScore = useCallback(async () => {
    const fetched = await voiceAdviceApi.currentBrainScore();
    if (fetched) {
      brainStore.save(fetched);
      setCurrentBrainScore(fetched);
    } else {
      setCurrentBrainScore(brainStore.current());
    }
    return brainStore.current();
  }, []);

  const refreshLatestAdvice = useCallback(() => {
    setLatestAdvice(adviceStore.latest());
  }, []);

  const deleteVoiceSession = useCallback((sessionId: string) => {
    voiceStore.deleteSession(sessionId);
    setVoiceSessions(voiceStore.load().sessions);
    setActiveSession((current) => (current?.sessionId === sessionId ? null : current));
  }, []);

  const resetAll = useCallback(() => {
    voiceStore.clearAll();
    checkinStore.clearAll();
    adviceStore.clearAll();
    brainStore.clearAll();
    setVoiceSessions([]);
    setActiveSession(null);
    setLatestCheckin(null);
    setLatestAdvice(null);
    setCurrentBrainScore(brainStore.current());
  }, []);

  const value = useMemo<VoiceAdviceContext>(
    () => ({
      isHydrated,
      voiceSessions,
      activeSession,
      latestCheckin,
      latestAdvice,
      currentBrainScore,
      openSession,
      finishSession,
      confirmTranscript,
      saveCheckin,
      runAdvice,
      refreshBrainScore,
      refreshLatestAdvice,
      deleteVoiceSession,
      resetAll,
    }),
    [isHydrated, voiceSessions, activeSession, latestCheckin, latestAdvice, currentBrainScore, openSession, finishSession, confirmTranscript, saveCheckin, runAdvice, refreshBrainScore, refreshLatestAdvice, deleteVoiceSession, resetAll],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useVoiceAdvice() {
  const context = useContext(Context);
  if (!context) throw new Error("useVoiceAdvice must be used inside VoiceAdviceProvider");
  return context;
}

export function notifyVoiceAdviceStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORE_UPDATED_EVENT));
}
