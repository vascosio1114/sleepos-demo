export type ExploreSystemKey = "brain" | "heart_autonomic" | "lungs_breathing" | "gut_nutrition" | "muscle_recovery" | "metabolic_labs";

export interface ExploreSystem {
  key: ExploreSystemKey;
  label: string;
  modelLayer: "brain" | "heart" | "lungs" | "gut" | null;
  status: "Attention" | "Good" | "Stable" | "Recovering";
  summary: string;
  metrics: readonly { label: string; value: string }[];
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  calendarSuggestions: readonly { label: string; detail: string; href: string }[];
  regionNote?: string;
}

export const exploreSystems: readonly ExploreSystem[] = [
  {
    key: "brain", label: "Brain", modelLayer: "brain", status: "Attention",
    summary: "Reaction time was slower than Alex’s demo baseline. This happened alongside shorter sleep and lower HRV.",
    metrics: [{ label: "Attention", value: "78 / 100" }, { label: "Reaction", value: "312 ms" }, { label: "Stress regulation", value: "64 / 100" }],
    primaryAction: { label: "Start brain training", href: "/plan?start=brain-training" },
    secondaryAction: { label: "View brain insight", href: "/insights?system=brain" },
    calendarSuggestions: [
      { label: "Sleep rhythm", detail: "Keep a consistent wind-down window", href: "/plan#factor-sleep" },
      { label: "Learning session", detail: "Schedule a focused practice block", href: "/plan#factor-learning" },
      { label: "Annual checkup reminder", detail: "Confirm the right cadence with a clinician", href: "/plan#annual-checkup" },
    ],
  },
  {
    key: "heart_autonomic", label: "Heart + autonomic", modelLayer: "heart", status: "Attention",
    summary: "HRV is below Alex’s demo baseline. This can be useful recovery context, but it does not identify a cause.",
    metrics: [{ label: "HRV", value: "42 ms" }, { label: "Resting HR", value: "72 bpm" }, { label: "7-day trend", value: "Down 12%" }],
    primaryAction: { label: "View HRV insight", href: "/insights?system=heart_autonomic" },
    calendarSuggestions: [
      { label: "Heart-friendly meals", detail: "Add a nutrition planning prompt", href: "/plan#factor-nutrition" },
      { label: "Cardio movement", detail: "Schedule a regular movement block", href: "/plan#factor-cardio" },
      { label: "Annual checkup reminder", detail: "Confirm the right cadence with a clinician", href: "/plan#annual-checkup" },
    ],
  },
  {
    key: "lungs_breathing", label: "Lungs + breathing", modelLayer: "lungs", status: "Good",
    summary: "The simulated breathing signals are within the demo reference range. A paced session can support winding down.",
    metrics: [{ label: "SpO₂", value: "98%" }, { label: "Respiratory rate", value: "14 / min" }],
    primaryAction: { label: "Start breathing", href: "/plan?start=breathing" },
    calendarSuggestions: [
      { label: "Breathing practice", detail: "Add a paced five-minute session", href: "/plan#factor-breathing" },
      { label: "Daily movement", detail: "Plan a comfortable activity window", href: "/plan#factor-movement" },
      { label: "Annual checkup reminder", detail: "Confirm the right cadence with a clinician", href: "/plan#annual-checkup" },
    ],
  },
  {
    key: "gut_nutrition", label: "Gut + nutrition", modelLayer: "gut", status: "Stable",
    summary: "A dated demo assessment is available. Nutrition context needs a current check-in before it informs the plan.",
    metrics: [{ label: "Assessment", value: "18 Jul" }, { label: "Nutrition", value: "Needs check-in" }],
    primaryAction: { label: "View assessment", href: "/profile#assessments" },
    calendarSuggestions: [
      { label: "Food planning", detail: "Set a balanced-meal planning prompt", href: "/plan#factor-nutrition" },
      { label: "Daily movement", detail: "Add a gentle post-meal activity window", href: "/plan#factor-movement" },
      { label: "Annual checkup reminder", detail: "Confirm the right cadence with a clinician", href: "/plan#annual-checkup" },
    ],
  },
  {
    key: "muscle_recovery", label: "Muscle + recovery", modelLayer: null, status: "Recovering",
    summary: "Moderate demo load is shown as regional recovery context, not as a precise anatomical muscle reading.",
    metrics: [{ label: "Recovery", value: "73 / 100" }, { label: "Load", value: "Moderate" }],
    primaryAction: { label: "View recovery", href: "/insights?system=muscle_recovery" },
    calendarSuggestions: [
      { label: "Strength session", detail: "Add a progressive movement block", href: "/plan#factor-strength" },
      { label: "Food planning", detail: "Schedule a recovery-meal prompt", href: "/plan#factor-nutrition" },
      { label: "Annual checkup reminder", detail: "Confirm the right cadence with a clinician", href: "/plan#annual-checkup" },
    ],
    regionNote: "Regional overlay — the supplied model has no verified muscle mesh.",
  },
  {
    key: "metabolic_labs", label: "Metabolic + labs", modelLayer: null, status: "Good",
    summary: "Simulated lab values are shown as record context. SleepOS does not interpret them as a diagnosis.",
    metrics: [{ label: "ALT", value: "Normal · Demo" }, { label: "AST", value: "Normal · Demo" }, { label: "Glucose", value: "Normal · Demo" }],
    primaryAction: { label: "View records", href: "/profile#records" },
    calendarSuggestions: [
      { label: "Food planning", detail: "Add a regular nutrition check-in", href: "/plan#factor-nutrition" },
      { label: "Movement rhythm", detail: "Schedule a consistent activity block", href: "/plan#factor-movement" },
      { label: "Annual checkup reminder", detail: "Confirm the right cadence with a clinician", href: "/plan#annual-checkup" },
    ],
    regionNote: "Regional overlay — the supplied model has no verified metabolic mesh.",
  },
] as const;

export function isExploreSystemKey(value: string | null): value is ExploreSystemKey {
  return exploreSystems.some((system) => system.key === value);
}
