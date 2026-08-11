import { describe, expect, it } from "vitest";
import { alexDemo, sourceStatusLabel } from "./demo-data";

describe("canonical Alex demo", () => {
  it("keeps Home to exactly three primary metrics", () => {
    expect(alexDemo.metrics).toHaveLength(3);
    expect(alexDemo.metrics.map((metric) => metric.value)).toEqual(["6h 18m", "42 ms", "312 ms"]);
  });

  it("labels source states explicitly", () => {
    expect(sourceStatusLabel("not_connected")).toBe("Not connected");
    expect(sourceStatusLabel("simulated")).toBe("Simulated");
  });

  it("links Home metrics to canonical destination keys", () => {
    expect(alexDemo.metrics.find((metric) => metric.key === "hrv")?.href).toBe("/explore?system=heart_autonomic");
    expect(alexDemo.metrics.find((metric) => metric.key === "reaction")?.href).toBe("/explore?system=brain");
  });
});
