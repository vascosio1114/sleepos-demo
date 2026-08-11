import { describe, expect, it } from "vitest";
import { buildRecoveryInsight, sevenDayTrends } from "./insight-rules";

describe("deterministic recovery insight", () => {
  it("uses the canonical seven-day HRV series", () => {
    expect(sevenDayTrends.hrv).toEqual([49, 48, 47, 45, 44, 43, 42]);
  });

  it("uses cautious language and a bounded action", () => {
    const insight = buildRecoveryInsight();
    expect(insight.headline).toContain("appeared together");
    expect(insight.possibleRelationship).toContain("may");
    expect(insight.possibleRelationship.toLowerCase()).not.toContain("caused by");
    expect(insight.actionType).toBe("breathing");
    expect(insight.ruleIds).toHaveLength(3);
    expect(insight.comparisonWindow).toBe("current_day_vs_baseline");
  });
});
