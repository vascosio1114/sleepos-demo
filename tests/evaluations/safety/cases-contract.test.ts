// Contract gate for the safety evaluation suite.
// Per A2A plan §5.2, the suite must reach 50–100 cases before model
// evaluation. This test enforces a floor of 40 cases plus per-version
// invariants until expert review completes.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface EvalCase {
  id: string;
  category: string;
  expectedSafetyLevel: "green" | "amber" | "red";
  expertReviewPending: boolean;
  expectedAdviceItemCount: { min: number; max: number };
  expectedProhibitedPhrases: string[];
  expectedMustInclude: string[];
}

const SAFETY_DIR = join(process.cwd(), "tests", "evaluations", "safety");

function loadAllCases(): EvalCase[] {
  const files = readdirSync(SAFETY_DIR)
    .filter((name) => /^v\d+-cases\.jsonl$/.test(name))
    .sort();
  const allCases: EvalCase[] = [];
  for (const file of files) {
    const path = join(SAFETY_DIR, file);
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = JSON.parse(trimmed) as EvalCase;
      allCases.push(parsed);
    }
  }
  return allCases;
}

describe("safety evaluation suite contract", () => {
  const cases = loadAllCases();
  const ids = new Set(cases.map((c) => c.id));
  const categories = new Set(cases.map((c) => c.category));

  it("contains at least 40 cases (A2A §5.2 floor)", () => {
    expect(cases.length).toBeGreaterThanOrEqual(40);
  });

  it("covers all 8 safety categories", () => {
    const expected = ["ordinary_checkin", "ambiguous_number", "diagnosis_request", "medication_change", "crisis", "prompt_injection", "asr_misrecognition", "no_data"];
    for (const category of expected) {
      expect(categories.has(category), `missing category ${category}`).toBe(true);
    }
  });

  it("has unique ids across all versions", () => {
    expect(ids.size).toBe(cases.length);
  });

  it("each case has expertReviewPending: true until promotion", () => {
    for (const c of cases) {
      expect(c.expertReviewPending, `case ${c.id} must be pending review`).toBe(true);
    }
  });

  it("each case has non-empty expectedProhibitedPhrases and expectedMustInclude", () => {
    for (const c of cases) {
      expect(c.expectedProhibitedPhrases.length, `${c.id} needs ≥1 prohibited phrase`).toBeGreaterThan(0);
      expect(c.expectedMustInclude.length, `${c.id} needs ≥1 must-include`).toBeGreaterThan(0);
    }
  });

  it("adviceItemCount bounds are valid (min ≤ max, max ≥ 1 except red)", () => {
    for (const c of cases) {
      const { min, max } = c.expectedAdviceItemCount;
      expect(min, `${c.id} min < 0`).toBeGreaterThanOrEqual(0);
      expect(max, `${c.id} max < min`).toBeGreaterThanOrEqual(min);
      if (c.expectedSafetyLevel !== "red") {
        expect(max, `${c.id} non-red must allow ≥1 item`).toBeGreaterThanOrEqual(1);
      } else {
        expect(max, `${c.id} red must cap at 0`).toBe(0);
        expect(min, `${c.id} red must cap at 0`).toBe(0);
      }
    }
  });
});