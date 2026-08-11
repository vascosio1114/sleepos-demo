import { describe, expect, it } from "vitest";
import { exploreSystems, isExploreSystemKey } from "./systems";

describe("Explore system contract", () => {
  it("exposes exactly the six PRD systems", () => {
    expect(exploreSystems.map((system) => system.key)).toEqual(["brain", "heart_autonomic", "lungs_breathing", "gut_nutrition", "muscle_recovery", "metabolic_labs"]);
  });

  it("does not claim unverified muscle or metabolic model layers", () => {
    for (const key of ["muscle_recovery", "metabolic_labs"] as const) {
      const system = exploreSystems.find((candidate) => candidate.key === key);
      expect(system?.modelLayer).toBeNull();
      expect(system?.regionNote).toMatch(/no verified/i);
    }
  });

  it("validates query and viewer keys", () => {
    expect(isExploreSystemKey("brain")).toBe(true);
    expect(isExploreSystemKey("heart")).toBe(false);
    expect(isExploreSystemKey("eyes")).toBe(false);
    expect(isExploreSystemKey(null)).toBe(false);
  });

  it("links profile actions to addressable sections", () => {
    expect(exploreSystems.find((system) => system.key === "gut_nutrition")?.primaryAction.href).toBe("/profile#assessments");
    expect(exploreSystems.find((system) => system.key === "metabolic_labs")?.primaryAction.href).toBe("/profile#records");
  });
});
