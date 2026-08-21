import { describe, expect, it } from "vitest";
import { classifySafety, isProhibited, synthesizeEscalation, validateAdviceOutput } from "./safety";
import type { AdviceOutput } from "./types";

function advice(partial: Partial<AdviceOutput>): AdviceOutput {
  return {
    adviceRunId: "test",
    status: "succeeded",
    safetyLevel: "green",
    safetyReasonCodes: ["minor_low_risk_wellness"],
    summary: "You shared a steady day",
    observations: [],
    adviceItems: [
      { title: "Try a wind-down routine", reason: "Consistent pre-sleep habits may support recovery.", actionType: "routine", routineKey: "wind_down_30_min_no_screens", durationMinutes: 30, riskLevel: "low" },
    ],
    brainDomains: [],
    sourceIds: ["sleep-hygiene-fundamentals-en-v1"],
    followUpQuestion: null,
    escalation: null,
    speakableText: "You shared a steady day. Try a wind-down routine.",
    provenance: {
      promptVersion: "advice-prompt-mock-v1",
      knowledgeVersion: "kb-en-2026-08-19-draft",
      safetyReasonCodes: ["minor_low_risk_wellness"],
      adviceProviderKey: "mock",
    },
    ...partial,
  };
}

describe("classifySafety", () => {
  it("routes ordinary check-ins to green", () => {
    const result = classifySafety({ transcriptText: "I slept about six hours last night.", checkin: null });
    expect(result.level).toBe("green");
    expect(result.reasonCodes).toContain("minor_low_risk_wellness");
    expect(result.requiresProfessionalReferral).toBe(false);
    expect(result.requiresImmediateEscalation).toBe(false);
  });

  it("routes crisis self-harm content to red", () => {
    const result = classifySafety({ transcriptText: "I want to kill myself.", checkin: null });
    expect(result.level).toBe("red");
    expect(result.reasonCodes).toContain("crisis_self_harm");
    expect(result.requiresImmediateEscalation).toBe(true);
  });

  it("routes acute medical symptoms to red", () => {
    const result = classifySafety({ transcriptText: "Severe chest pain and I can't breathe.", checkin: null });
    expect(result.level).toBe("red");
    expect(result.reasonCodes).toContain("crisis_medical_emergency");
  });

  it("routes diagnosis requests to amber without claiming a diagnosis", () => {
    const result = classifySafety({ transcriptText: "Do I have insomnia?", checkin: null });
    expect(result.level).toBe("amber");
    expect(result.reasonCodes).toContain("diagnosis_request");
    expect(result.requiresProfessionalReferral).toBe(true);
    expect(result.requiresImmediateEscalation).toBe(false);
  });

  it("routes medication stop requests to amber", () => {
    const result = classifySafety({ transcriptText: "Can I stop my sleeping medication?", checkin: null });
    expect(result.level).toBe("amber");
    expect(result.reasonCodes).toContain("medication_change_request");
  });

  it("routes named drug mentions to amber", () => {
    const result = classifySafety({ transcriptText: "Is there a natural alternative to melatonin?", checkin: null });
    expect(result.level).toBe("amber");
    expect(result.reasonCodes).toContain("medication_change_request");
  });

  it("detects sustained decline via metrics even without transcript keyword", () => {
    const result = classifySafety({
      transcriptText: "Things have been tough.",
      checkin: { stressScore: 9, moodScore: 2, focusScore: 25, sleepMinutes: 320 },
    });
    expect(result.level).toBe("amber");
    expect(result.reasonCodes).toContain("sustained_decline_self_report");
  });

  it("does not escalate to amber for ordinary numbers", () => {
    const result = classifySafety({
      transcriptText: "Maybe around six or seven hours.",
      checkin: { stressScore: 5, moodScore: 6, focusScore: 70, sleepMinutes: 390 },
    });
    expect(result.level).toBe("green");
  });
});

describe("synthesizeEscalation", () => {
  it("uses escalation copy for red routing", () => {
    const escalation = synthesizeEscalation("red", ["crisis_self_harm"]);
    expect(escalation.level).toBe("red");
    expect(escalation.message).toContain("emergency");
  });

  it("uses wellnessScope-style copy for amber diagnosis", () => {
    const escalation = synthesizeEscalation("amber", ["diagnosis_request"]);
    expect(escalation.message.toLowerCase()).toContain("does not diagnose");
  });
});

describe("isProhibited", () => {
  it("blocks diagnostic claims", () => {
    expect(isProhibited("You have insomnia.")).not.toBeNull();
  });
  it("blocks cause claims", () => {
    expect(isProhibited("Stress caused your sleep problem.")).not.toBeNull();
  });
  it("allows uncertainty language", () => {
    expect(isProhibited("Sleep was shorter than usual this week.")).toBeNull();
  });
});

describe("validateAdviceOutput", () => {
  it("accepts a green advice with one item", () => {
    const result = validateAdviceOutput(advice({}));
    expect(result.valid).toBe(true);
  });

  it("rejects red advice with advice items", () => {
    const result = validateAdviceOutput(advice({ safetyLevel: "red", adviceItems: [
      { title: "Try meditation", reason: "Calm down.", actionType: "breathing", routineKey: null, durationMinutes: 3, riskLevel: "low" },
    ] }));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("red routing");
  });

  it("rejects an advice item with prohibited phrase", () => {
    const result = validateAdviceOutput(advice({ summary: "You have insomnia." }));
    expect(result.valid).toBe(false);
  });

  it("rejects routine action without routineKey", () => {
    const result = validateAdviceOutput(advice({
      adviceItems: [{ title: "Wind-down", reason: "Calm", actionType: "routine", routineKey: null, durationMinutes: 30, riskLevel: "low" }],
    }));
    expect(result.valid).toBe(false);
  });
});