import { NextRequest } from "next/server";
import { failure, generateRequestId, success } from "../../_lib/responses";
import type { HealthCheckin } from "../../_lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ checkinId: string }> }) {
  const requestId = generateRequestId();
  const { checkinId } = await params;
  if (!checkinId) return failure("VALIDATION_ERROR", "checkinId is required.", 400, requestId);

  const sample: HealthCheckin = {
    checkinId,
    userId: "demo_001",
    localDate: new Date().toISOString().slice(0, 10),
    schemaVersion: "health-checkin-v1",
    source: "voice_confirmed",
    capturedAt: new Date().toISOString(),
    sleepQualityScore: 55,
    sleepMinutes: 390,
    stressScore: 6,
    moodScore: 6,
    focusScore: 70,
    confirmedNote: null,
    sourceSegmentIds: [],
  };

  return success(sample, requestId);
}