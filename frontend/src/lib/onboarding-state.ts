export const ONBOARDING_STORAGE_KEY = "sleepos.onboarding.v1";
export const onboardingGoals = ["Sleep longer", "Wake more refreshed", "Sharpen focus", "Calm evenings"] as const;

export type OnboardingGoal = (typeof onboardingGoals)[number];
export type OnboardingDecision = "pending" | "completed" | "skipped";
export type WearableDecision = "pending" | "demo" | "skipped";
export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface OnboardingDraft {
  version: 1;
  step: OnboardingStep;
  goals: OnboardingGoal[];
  baseline: {
    bedtime: string;
    wakeTime: string;
    quality: 1 | 2 | 3 | 4 | 5 | null;
  };
  assessment: OnboardingDecision;
  wearable: WearableDecision;
  isComplete: boolean;
}

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidOnboardingTime(value: string) {
  return timePattern.test(value);
}

export function createInitialOnboardingDraft(): OnboardingDraft {
  return {
    version: 1,
    step: 0,
    goals: [],
    baseline: { bedtime: "22:30", wakeTime: "06:30", quality: null },
    assessment: "pending",
    wearable: "pending",
    isComplete: false,
  };
}

export function isOnboardingDraft(value: unknown): value is OnboardingDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<OnboardingDraft>;
  if (draft.version !== 1 || !Number.isInteger(draft.step) || Number(draft.step) < 0 || Number(draft.step) > 5) return false;
  if (!Array.isArray(draft.goals) || draft.goals.length > 3 || new Set(draft.goals).size !== draft.goals.length) return false;
  if (!draft.goals.every((goal) => onboardingGoals.includes(goal as OnboardingGoal))) return false;
  if (!draft.baseline || typeof draft.baseline !== "object") return false;
  if (!isValidOnboardingTime(draft.baseline.bedtime) || !isValidOnboardingTime(draft.baseline.wakeTime)) return false;
  if (draft.baseline.quality !== null && ![1, 2, 3, 4, 5].includes(draft.baseline.quality)) return false;
  if (!(["pending", "completed", "skipped"] as const).includes(draft.assessment as OnboardingDecision)) return false;
  if (!(["pending", "demo", "skipped"] as const).includes(draft.wearable as WearableDecision)) return false;
  if (typeof draft.isComplete !== "boolean") return false;
  if (Number(draft.step) >= 2 && draft.goals.length === 0) return false;
  if (Number(draft.step) >= 3 && draft.baseline.quality === null) return false;
  if (Number(draft.step) >= 4 && draft.assessment === "pending") return false;
  if (Number(draft.step) >= 5 && draft.wearable === "pending") return false;
  return !draft.isComplete || draft.step === 5;
}
