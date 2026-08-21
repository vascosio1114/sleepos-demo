// Runtime shape validators for the localStorage repositories.
// These mirrors are kept minimal so a corrupted snapshot resets safely to the seed.

import type { AdviceOutput, BrainScoreSnapshot, HealthCheckin, TranscriptResult, VoiceSession } from "./types";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): boolean {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
}

function isIsoDate(value: unknown): boolean {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function isStoredVoice(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { version?: unknown; sessions?: unknown; transcripts?: unknown; activeSessionId?: unknown };
  if (v.version !== 1) return false;
  if (!Array.isArray(v.sessions)) return false;
  if (!v.transcripts || typeof v.transcripts !== "object") return false;
  if (v.activeSessionId !== null && typeof v.activeSessionId !== "string") return false;
  for (const session of v.sessions as VoiceSession[]) {
    if (!session || typeof session !== "object") return false;
    if (!isUuid(session.sessionId)) return false;
    if (!isUuid(session.userId) && session.userId !== "demo_001") return false;
    if (typeof session.sttProviderKey !== "string") return false;
    if (typeof session.providerMode !== "string") return false;
    if (typeof session.language !== "string") return false;
    if (!isIsoDate(session.startedAt)) return false;
    if (session.completedAt !== null && !isIsoDate(session.completedAt)) return false;
    if (session.abandonedAt !== null && !isIsoDate(session.abandonedAt)) return false;
    if (session.durationSeconds !== null && !isIntegerInRange(session.durationSeconds, 0, 7200)) return false;
    if (!isIntegerInRange(session.confirmedSegmentCount, 0, 64)) return false;
    if (!isIntegerInRange(session.flaggedSegmentCount, 0, 64)) return false;
  }
  return true;
}

export function isStoredCheckin(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { version?: unknown; checkins?: unknown; lastCheckinId?: unknown };
  if (v.version !== 1) return false;
  if (!Array.isArray(v.checkins)) return false;
  if (v.lastCheckinId !== null && typeof v.lastCheckinId !== "string") return false;
  for (const checkin of v.checkins as HealthCheckin[]) {
    if (!checkin || typeof checkin !== "object") return false;
    if (!isUuid(checkin.checkinId)) return false;
    if (checkin.userId !== "demo_001") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin.localDate)) return false;
    if (checkin.schemaVersion !== "health-checkin-v1") return false;
    if (!isIsoDate(checkin.capturedAt)) return false;
    if (!["voice_confirmed", "manual_entry"].includes(checkin.source)) return false;
    if (checkin.sleepQualityScore !== null && !isIntegerInRange(checkin.sleepQualityScore, 0, 100)) return false;
    if (checkin.sleepMinutes !== null && !isIntegerInRange(checkin.sleepMinutes, 0, 1440)) return false;
    if (checkin.stressScore !== null && !isIntegerInRange(checkin.stressScore, 0, 10)) return false;
    if (checkin.moodScore !== null && !isIntegerInRange(checkin.moodScore, 0, 10)) return false;
    if (checkin.focusScore !== null && !isIntegerInRange(checkin.focusScore, 0, 100)) return false;
    if (checkin.confirmedNote !== null && typeof checkin.confirmedNote !== "string") return false;
    if (checkin.confirmedNote !== null && checkin.confirmedNote.length > 600) return false;
  }
  return true;
}

export function isStoredAdvice(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { version?: unknown; runs?: unknown; lastRunId?: unknown };
  if (v.version !== 1) return false;
  if (!Array.isArray(v.runs)) return false;
  if (v.lastRunId !== null && typeof v.lastRunId !== "string") return false;
  for (const run of v.runs as AdviceOutput[]) {
    if (!run || typeof run !== "object") return false;
    if (!isUuid(run.adviceRunId)) return false;
    if (!["pending", "succeeded", "failed_safe_fallback"].includes(run.status)) return false;
    if (!["green", "amber", "red"].includes(run.safetyLevel)) return false;
    if (!Array.isArray(run.safetyReasonCodes)) return false;
    if (typeof run.summary !== "string" || run.summary.length > 200) return false;
    if (!Array.isArray(run.adviceItems) || run.adviceItems.length > 3) return false;
    if (typeof run.speakableText !== "string" || run.speakableText.length === 0 || run.speakableText.length > 600) return false;
  }
  return true;
}

export function isStoredBrain(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { version?: unknown; snapshots?: unknown; currentSnapshotId?: unknown };
  if (v.version !== 1) return false;
  if (!Array.isArray(v.snapshots)) return false;
  if (v.currentSnapshotId !== null && typeof v.currentSnapshotId !== "string") return false;
  for (const snap of v.snapshots as BrainScoreSnapshot[]) {
    if (!snap || typeof snap !== "object") return false;
    if (!isUuid(snap.snapshotId)) return false;
    if (snap.protocolVersion !== "brain-domain-v1") return false;
    if (!["demo", "self_report", "cognitive_task", "qEEG", "HEG"].includes(snap.mode)) return false;
    if (!Array.isArray(snap.domains) || snap.domains.length !== 4) return false;
  }
  return true;
}

export function isValidTranscript(value: unknown): value is TranscriptResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<TranscriptResult>;
  return typeof v.sessionId === "string" && Array.isArray(v.segments) && typeof v.finalizedAt === "string";
}

export const isStoredShape = {
  voice: isStoredVoice,
  checkin: isStoredCheckin,
  advice: isStoredAdvice,
  brain: isStoredBrain,
  transcript: isValidTranscript,
};