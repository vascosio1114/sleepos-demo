export type WellnessStatus = "good" | "attention" | "no_data" | "completed";
export type SourceStatus = "connected" | "demo" | "simulated" | "not_connected" | "dated";

export interface DemoMetric {
  key: "sleep" | "hrv" | "reaction";
  label: string;
  value: string;
  detail: string;
  href: string;
  status: WellnessStatus;
}

export const alexDemo = {
  mode: "demo" as const,
  user: { id: "demo_001", name: "Alex", age: 35 },
  updatedLabel: "Today, 07:30",
  status: {
    value: "attention" as WellnessStatus,
    label: "Attention",
    headline: "Recovery may need attention",
    description: "Sleep was shorter and HRV was below your usual baseline. These changes happened alongside slower reaction time.",
  },
  metrics: [
    { key: "sleep", label: "Sleep", value: "6h 18m", detail: "52 min below baseline", href: "/insights?metric=sleep", status: "attention" },
    { key: "hrv", label: "HRV", value: "42 ms", detail: "Baseline 48 ms", href: "/explore?system=heart_autonomic", status: "attention" },
    { key: "reaction", label: "Reaction", value: "312 ms", detail: "Baseline 291 ms", href: "/explore?system=brain", status: "attention" },
  ] satisfies DemoMetric[],
  recommendation: {
    title: "Five-minute attention reset",
    description: "A short focus session is the clearest next step for today.",
    duration: "5 min",
    startHref: "/plan?start=brain-training",
  },
  progress: { completed: 0, total: 3 },
  sources: {
    devices: [
      { name: "Apple Watch", detail: "Sleep and overnight signals", status: "demo" as SourceStatus },
      { name: "Smart ring", detail: "No source selected", status: "not_connected" as SourceStatus },
    ],
    assessments: [
      { name: "Brain baseline", detail: "Reaction and attention", status: "demo" as SourceStatus },
      { name: "Microbiome assessment", detail: "Recorded 18 Jul", status: "dated" as SourceStatus },
    ],
    records: [
      { name: "Lab record", detail: "ALT, AST and glucose", status: "simulated" as SourceStatus },
      { name: "Document upload", detail: "No files added", status: "not_connected" as SourceStatus },
    ],
  },
} as const;

export const wellnessDisclaimer = "SleepOS provides wellness information and does not replace professional medical advice or diagnosis.";

export function sourceStatusLabel(status: SourceStatus) {
  return {
    connected: "Connected",
    demo: "Demo",
    simulated: "Simulated",
    not_connected: "Not connected",
    dated: "Dated",
  }[status];
}
