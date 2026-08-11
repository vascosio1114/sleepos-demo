import { describe, expect, it } from "vitest";
import { completedActionCount, createInitialPlanState, planReducer, type BrainTrainingResult } from "./plan-state";

const result: BrainTrainingResult = {
  id: "session_demo_001",
  type: "brain_training",
  reactionTime: 304,
  accuracy: 91,
  missedResponses: 1,
  completedTrialCount: 5,
  baselineComparisonPercent: 4,
  durationSeconds: 42,
  completedAt: "2026-08-11T01:20:00+08:00",
};

describe("plan state", () => {
  it("starts with exactly three pending priorities", () => {
    const state = createInitialPlanState();
    expect(state.actions).toHaveLength(3);
    expect(state.actions.every((action) => action.status === "pending")).toBe(true);
  });

  it("saves a training session idempotently and completes one action", () => {
    const once = planReducer(createInitialPlanState(), { type: "save_training", result });
    const twice = planReducer(once, { type: "save_training", result });
    expect(twice.sessions).toHaveLength(1);
    expect(completedActionCount(twice)).toBe(1);
  });

  it("does not mark an active session complete", () => {
    const active = planReducer(createInitialPlanState(), { type: "start", id: "brain_training" });
    expect(active.actions[0].status).toBe("active");
    expect(completedActionCount(active)).toBe(0);
  });

  it("returns an abandoned action to pending", () => {
    const active = planReducer(createInitialPlanState(), { type: "start", id: "breathing" });
    const abandoned = planReducer(active, { type: "abandon", id: "breathing" });
    expect(abandoned.actions[1].status).toBe("pending");
  });
});
