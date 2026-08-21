import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS, findScenario } from "./scenarios";
import { generateMockAdvice, scenarioToTranscriptResult } from "./mock-providers";
import { classifySafety } from "./safety";
import type { HealthCheckin } from "./types";

function checkinFromScenario(): HealthCheckin {
  return {
    checkinId: "test-checkin",
    userId: "demo_001",
    localDate: "2026-08-19",
    schemaVersion: "health-checkin-v1",
    source: "voice_confirmed",
    capturedAt: new Date().toISOString(),
    sleepQualityScore: null,
    sleepMinutes: null,
    stressScore: null,
    moodScore: null,
    focusScore: null,
    confirmedNote: null,
    sourceSegmentIds: [],
  };
}

describe("scenarioToTranscriptResult", () => {
  it("produces segments with stable timing and confidence", () => {
    const scenario = findScenario("voice_safe_short_v1");
    expect(scenario).not.toBeNull();
    const result = scenarioToTranscriptResult({ sessionId: "test", scenario: scenario!, language: "en-US" });
    expect(result.segments.length).toBe(scenario!.transcript.length);
    expect(result.segments.every((segment) => segment.confidence > 0)).toBe(true);
    expect(result.segments.every((segment) => segment.endedAtMs >= segment.startedAtMs)).toBe(true);
  });
});

describe("generateMockAdvice", () => {
  it("emits red routing with zero advice items for crisis self-harm", () => {
    const scenario = findScenario("voice_crisis_self_harm_v1")!;
    const checkin = checkinFromScenario();
    const transcriptText = scenario.transcript.map((s) => s.text).join(" ");
    const safety = classifySafety({ transcriptText, checkin });
    expect(safety.level).toBe("red");
    const advice = generateMockAdvice({ adviceRunId: "run-red", transcriptText, checkin });
    expect(advice.safetyLevel).toBe("red");
    expect(advice.adviceItems.length).toBe(0);
    expect(advice.escalation).not.toBeNull();
    expect(advice.speakableText.toLowerCase()).toContain("emergency");
  });

  it("emits amber routing without advice items for diagnosis requests", () => {
    const scenario = findScenario("voice_diagnosis_insomnia_v1")!;
    const checkin = checkinFromScenario();
    const transcriptText = scenario.transcript.map((s) => s.text).join(" ");
    const advice = generateMockAdvice({ adviceRunId: "run-amber", transcriptText, checkin });
    expect(advice.safetyLevel).toBe("amber");
    expect(advice.escalation).not.toBeNull();
    expect(advice.speakableText.toLowerCase()).toContain("does not diagnose");
  });

  it("emits green routing with low-risk advice items for ordinary check-ins", () => {
    const scenario = findScenario("voice_safe_short_v1")!;
    const checkin: HealthCheckin = {
      ...checkinFromScenario(),
      sleepMinutes: 360,
      stressScore: 7,
      focusScore: 60,
    };
    const transcriptText = scenario.transcript.map((s) => s.text).join(" ");
    const advice = generateMockAdvice({ adviceRunId: "run-green", transcriptText, checkin });
    expect(advice.safetyLevel).toBe("green");
    expect(advice.adviceItems.length).toBeGreaterThan(0);
    expect(advice.adviceItems.every((item) => item.riskLevel === "low")).toBe(true);
  });

  it("includes a routine advice item for short sleep", () => {
    const scenario = findScenario("voice_safe_short_v1")!;
    const checkin: HealthCheckin = {
      ...checkinFromScenario(),
      sleepMinutes: 320,
      stressScore: 7,
      moodScore: 5,
      focusScore: 60,
    };
    const transcriptText = scenario.transcript.map((s) => s.text).join(" ");
    const advice = generateMockAdvice({ adviceRunId: "run-routine", transcriptText, checkin });
    const routineItem = advice.adviceItems.find((item) => item.actionType === "routine");
    expect(routineItem).toBeDefined();
    expect(routineItem?.routineKey).toBe("wind_down_30_min_no_screens");
  });
});

describe("DEMO_SCENARIOS coverage", () => {
  it("covers all 8 safety categories", () => {
    const categories = new Set(DEMO_SCENARIOS.map((s) => s.category));
    expect(categories.size).toBe(8);
  });

  it("contains 18 scenarios matching the v0-cases JSONL", () => {
    expect(DEMO_SCENARIOS.length).toBe(18);
  });
});