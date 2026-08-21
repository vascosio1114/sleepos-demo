import { describe, expect, it, vi } from "vitest";
import { voiceAdviceApi } from "./api";
import type { HealthCheckin } from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("voiceAdviceApi", () => {
  it("sends an idempotency UUID when saving a check-in", async () => {
    const checkin: HealthCheckin = {
      checkinId: "11111111-1111-4111-8111-111111111111",
      userId: "alex-demo",
      localDate: "2026-08-21",
      schemaVersion: "health-checkin-v1",
      source: "voice_confirmed",
      capturedAt: "2026-08-21T02:30:00.000Z",
      sleepQualityScore: 45,
      sleepMinutes: 390,
      stressScore: 7,
      moodScore: 5,
      focusScore: 58,
      confirmedNote: null,
      sourceSegmentIds: [],
    };

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: checkin, meta: { requestId: "req-1", apiVersion: "v1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(voiceAdviceApi.saveCheckin({ ...checkin, checkinId: undefined } as Omit<HealthCheckin, "checkinId">)).resolves.toEqual(checkin);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body.idempotencyKey).toEqual(expect.stringMatching(uuidPattern));

    fetchMock.mockRestore();
  });
});
