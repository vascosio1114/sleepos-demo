// SleepOS safety taxonomy constants.
// Single source of truth for the Green / Amber / Red safety router
// described in docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md §7 and
// docs/PRODUCT_REQUIREMENTS.md §8.
//
// Wire values must match `docs/DATABASE_SCHEMA.md` `safety_level` enum.

export const SAFETY_LEVELS = ['green', 'amber', 'red'] as const;
export type SafetyLevel = (typeof SAFETY_LEVELS)[number];

// Deterministic phrase / intent routing reasons. The router may emit
// multiple reasons; the most severe wins (red > amber > green).
export const SAFETY_REASON_CODES = [
  'crisis_self_harm',
  'crisis_medical_emergency',
  'diagnosis_request',
  'medication_change_request',
  'sustained_decline_self_report',
  'conflicting_metric_signals',
  'minor_low_risk_wellness',
  'no_signals',
] as const;
export type SafetyReasonCode = (typeof SAFETY_REASON_CODES)[number];

// Copy identifiers consumed by the UI. The footer identifier
// `wellnessDisclaimer` already exists in SHARED_KEYS §11; this file
// adds two new identifiers specific to voice / AI advice flows.
export const SAFETY_COPY_IDS = [
  'wellnessDisclaimer',
  'escalationCopy',
  'wellnessScope',
] as const;
export type SafetyCopyId = (typeof SAFETY_COPY_IDS)[number];

// English copy. Localisation is out of scope for MVP; new locales
// must be reviewed by clinical / wellness owner.
export const SAFETY_COPY: Record<SafetyCopyId, { key: SafetyCopyId; text: string; reviewStatus: 'approved' | 'pending' }> = {
  wellnessDisclaimer: {
    key: 'wellnessDisclaimer',
    text: 'SleepOS provides wellness information and does not replace professional medical advice or diagnosis.',
    reviewStatus: 'approved',
  },
  escalationCopy: {
    key: 'escalationCopy',
    // Region-specific hotline numbers must be filled in by Legal / Clinical
    // reviewer for each release region. The placeholder "REGIONAL_HOTLINE"
    // is intentionally invalid and will fail content review.
    text: 'This sounds urgent. Please contact a local emergency service or a trusted person right now. SleepOS does not provide emergency support. If you are in [REGION], you can call [REGIONAL_HOTLINE].',
    reviewStatus: 'pending',
  },
  wellnessScope: {
    key: 'wellnessScope',
    text: 'SleepOS helps you understand your sleep, train your brain, and choose low-risk wellness actions. It is not a diagnostic tool and does not replace professional care.',
    reviewStatus: 'pending',
  },
};

// Output restrictions (PRD §8 + A2A §7.2). Any generated text matching
// any of these phrases must be rejected by the output validator.
export const PROHIBITED_OUTPUT_PATTERNS: ReadonlyArray<{ id: string; pattern: RegExp; rationale: string }> = [
  { id: 'diag_you_have', pattern: /you (have|are suffering from|are diagnosed with)\b/i, rationale: 'No diagnostic claim' },
  { id: 'diag_insomnia', pattern: /\binsomnia\b.*\b(you have|you likely have|diagnosis)/i, rationale: 'No diagnostic claim for insomnia' },
  { id: 'med_start', pattern: /\b(start|begin|stop|quit|increase|decrease|change)\b.*\b(your\s+)?(medication|medicine|pill|dose|dosage)\b/i, rationale: 'No medication change advice' },
  { id: 'med_specific_drug', pattern: /\b(melatonin|ambien|zolpidem|benadryl|valium|xanax|modafinil|antidepressant)\b/i, rationale: 'No named drug recommendations' },
  { id: 'cause_claim', pattern: /\b(caused|causes|is the reason|is why)\b/i, rationale: 'No causation claims from correlations' },
  { id: 'cure_claim', pattern: /\b(cure|cures|treats|treatment for)\b/i, rationale: 'No treatment claims' },
  { id: 'unverified_percent', pattern: /\b\d{1,3}\s?%\b.*\b(effective|cure|treatment|improvement|reduction)\b/i, rationale: 'No unsourced percentages' },
  { id: 'qEEG_misclaim', pattern: /\b(qEEG|brain scan)\b/i, rationale: 'No claim that self-report / cognitive task is a clinical brain scan' },
  { id: 'regional_score_misclaim', pattern: /\b(frontal|parietal|temporal|occipital|prefrontal|amygdala|hippocampus)\b.*\b(score|measurement)\b/i, rationale: 'No measured regional brain score without QEEG / HEG source' },
];

// Phrase lists used by the deterministic safety classifier. These are
// intentionally narrow; ambiguous phrases route to amber, never red.
export const CRISIS_PHRASE_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(kill myself|end my life|suicide|want to die)\b/i,
  /\b(self[- ]harm|cut myself|hurt myself)\b/i,
];

export const MEDICAL_EMERGENCY_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(chest pain|severe chest pain|heart attack)\b/i,
  /\b(can'?t breathe|cannot breathe|shortness of breath|severe shortness of breath)\b/i,
  /\b(passed out|loss of consciousness|fainting|fainted)\b/i,
  /\b(stroke|slurred speech|one[- ]sided weakness)\b/i,
];

export const DIAGNOSIS_REQUEST_PATTERNS: ReadonlyArray<RegExp> = [
  /\bdo i have\b.*\b(insomnia|sleep disorder|apnea|depression|anxiety|adhd|autism)\b/i,
  /\bcan you diagnose\b/i,
  /\bis this\b.*\b(insomnia|sleep disorder|apnea|depression)\b/i,
];

export const MEDICATION_CHANGE_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(can i|should i|may i)\b.*\b(stop|quit|start|increase|decrease|change)\b.*\b(medication|medicine|pill|prescription)\b/i,
  /\b(alternative to|instead of)\b.*\b(medication|medicine|prescription)\b/i,
];

// Default safety classification for ordinary wellness check-in.
export const DEFAULT_GREEN_CLASSIFICATION = {
  level: 'green' as const,
  reasonCodes: ['minor_low_risk_wellness'] as ReadonlyArray<SafetyReasonCode>,
  requiresEscalation: false,
  requiresProfessionalReferral: false,
};