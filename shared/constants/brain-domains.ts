// Brain score domain and mode enums.
// Source: A2A Voice + Brain Integration Plan §6.3.

export const BRAIN_DOMAINS = [
  'attention',
  'regulation',
  'memory',
  'sleep_arousal',
] as const;
export type BrainDomain = (typeof BRAIN_DOMAINS)[number];

// Mode tells the UI how to label and contextualise the score.
export const BRAIN_SCORE_MODES = [
  'demo',
  'self_report',
  'cognitive_task',
  'qEEG',
  'HEG',
] as const;
export type BrainScoreMode = (typeof BRAIN_SCORE_MODES)[number];

// Quality flag for the underlying measurement.
export const BRAIN_SCORE_QUALITIES = [
  'acceptable',
  'marginal',
  'poor',
  'unverified',
] as const;
export type BrainScoreQuality = (typeof BRAIN_SCORE_QUALITIES)[number];

// Display label + measured flag per mode. The UI must read this
// table; do not hard-code labels in components.
export const BRAIN_MODE_DISPLAY: Readonly<Record<BrainScoreMode, { label: string; measuredByDefault: boolean; requiresAssessor: boolean }>> = {
  demo: { label: 'Demo / simulated', measuredByDefault: false, requiresAssessor: false },
  self_report: { label: 'Self-reported', measuredByDefault: false, requiresAssessor: false },
  cognitive_task: { label: 'Cognitive task', measuredByDefault: true, requiresAssessor: false },
  qEEG: { label: 'Quantitative EEG assessment', measuredByDefault: true, requiresAssessor: true },
  HEG: { label: 'Hemoencephalography assessment', measuredByDefault: true, requiresAssessor: true },
};

// Score bounds. 0–100 integer scale matches existing `attentionScore`,
// `memoryScore`, `stressRegulationScore`, `muscleRecoveryScore`.
export const BRAIN_DOMAIN_SCORE_BOUNDS = { min: 0, max: 100 } as const;

// `regionalScores` is only populated for qualified assessment sources.
// Per A2A §6.2 we do not generate fake regional scores.
export const REGIONAL_SCORE_BRAIN_KEYS = [
  'frontal',
  'prefrontal',
  'parietal',
  'temporal',
  'occipital',
  'central',
  'amygdala',
  'hippocampus',
  'cingulate',
  'insula',
] as const;
export type RegionalScoreBrainKey = (typeof REGIONAL_SCORE_BRAIN_KEYS)[number];

// 5D assessment dimensions (Quantik Wellness concept; Phase 4 trainer
// layer only). Surfaced as a separate concept from `BrainDomain` — UI
// must not collapse the two.
export const ASSESSMENT_5D_DIMENSIONS = [
  'energy_metabolism',
  'network_connectivity',
  'symmetrical_balance',
  'depth_state',
  'functional_performance',
] as const;
export type Assessment5D = (typeof ASSESSMENT_5D_DIMENSIONS)[number];