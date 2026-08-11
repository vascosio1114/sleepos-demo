import { alexDemo } from "./demo-data";

export const sevenDayTrends = {
  sleep: [7.33, 7.08, 6.92, 6.67, 6.53, 6.33, 6.3],
  hrv: [49, 48, 47, 45, 44, 43, 42],
  stress: [4, 5, 5, 6, 6, 7, 7],
  reactionTime: [291, 294, 298, 301, 305, 309, 312],
} as const;

export interface RecoveryInsight {
  id: "recovery_attention";
  severity: "attention";
  headline: string;
  summary: string;
  whatChanged: string;
  alongside: string;
  possibleRelationship: string;
  nextAction: string;
  actionType: "breathing";
  generatedBy: "deterministic_rules";
  ruleIds: readonly ["sleep_hrv_attention_v1", "stress_hrv_regulation_v1", "sleep_reaction_context_v1"];
  comparisonWindow: "current_day_vs_baseline";
  evidence: readonly { label: string; value: string; change: string }[];
}

export function buildRecoveryInsight(): RecoveryInsight {
  const sleepDrop = Math.round(((7.17 - 6.3) / 7.17) * 100);
  const hrvDrop = Math.round(((48 - 42) / 48) * 100);
  const reactionSlowing = Math.round(((312 - 291) / 291) * 100);

  return {
    id: "recovery_attention",
    severity: "attention",
    headline: "Shorter sleep, lower HRV, and slower responses appeared together.",
    summary: alexDemo.status.description,
    whatChanged: "Your sleep duration has gradually decreased across the past seven days.",
    alongside: "HRV decreased while reported stress increased and reaction time became slower.",
    possibleRelationship: "These changes may be associated with reduced recovery during a period of higher reported stress.",
    nextAction: "Complete a short regulation session tonight, then reassess after sleep.",
    actionType: "breathing",
    generatedBy: "deterministic_rules",
    ruleIds: ["sleep_hrv_attention_v1", "stress_hrv_regulation_v1", "sleep_reaction_context_v1"],
    comparisonWindow: "current_day_vs_baseline",
    evidence: [
      { label: "Sleep", value: "6h 18m", change: `−${sleepDrop}%` },
      { label: "HRV", value: "42 ms", change: `−${hrvDrop}%` },
      { label: "Reaction", value: "312 ms", change: `+${reactionSlowing}% slower` },
    ],
  };
}
