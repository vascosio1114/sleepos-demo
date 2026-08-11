import { describe, expect, it } from "vitest";
import { createInitialOnboardingDraft, isOnboardingDraft } from "./onboarding-state";

describe("onboarding draft contract", () => {
  it("creates a recoverable synthetic draft", () => {
    expect(createInitialOnboardingDraft()).toMatchObject({ version: 1, step: 0, goals: [], assessment: "pending", wearable: "pending", isComplete: false });
  });

  it("accepts a completed bounded draft", () => {
    expect(isOnboardingDraft({
      version: 1,
      step: 5,
      goals: ["Sleep longer", "Sharpen focus"],
      baseline: { bedtime: "22:30", wakeTime: "06:30", quality: 3 },
      assessment: "skipped",
      wearable: "demo",
      isComplete: true,
    })).toBe(true);
  });

  it("rejects malformed, duplicate, and incomplete completed drafts", () => {
    const base = createInitialOnboardingDraft();
    expect(isOnboardingDraft({ ...base, goals: ["Sleep longer", "Sleep longer"] })).toBe(false);
    expect(isOnboardingDraft({ ...base, baseline: { ...base.baseline, bedtime: "25:00" } })).toBe(false);
    expect(isOnboardingDraft({ ...base, step: 5, isComplete: true })).toBe(false);
    expect(isOnboardingDraft({ ...base, step: 4, goals: ["Sleep longer"], baseline: { ...base.baseline, quality: 3 } })).toBe(false);
  });
});
