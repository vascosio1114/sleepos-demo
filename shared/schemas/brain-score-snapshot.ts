// Brain score snapshot — multi-mode functional domain scoring.
// Source: A2A Voice + Brain Integration Plan §6.3.

import type {
  Assessment5D,
  BrainDomain,
  BrainScoreMode,
  BrainScoreQuality,
  RegionalScoreBrainKey,
} from '../constants/brain-domains';

export interface BrainDomainScore {
  key: BrainDomain;
  /** 0..100. */
  score: number;
  /** `good | attention | no_data` (mirrors SHARED_KEYS §5 WellnessStatus). */
  status: 'good' | 'attention' | 'no_data';
  /** Whether this came from a measured source (per mode display table). */
  measured: boolean;
  /** Metric keys that back the score; allowlisted. */
  sourceMetricKeys: ReadonlyArray<string>;
  /** Bounded quality flag. */
  quality: BrainScoreQuality;
}

export interface RegionalScore {
  /** Required to be a brain region key from the constant allowlist. */
  brainKey: RegionalScoreBrainKey;
  /** 0..100. */
  score: number;
  /** Required for qEEG / HEG; absent for self-report / demo. */
  protocolVersion?: string;
  assessorId?: string;
}

export interface Assessment5DScore {
  dimension: Assessment5D;
  /** 0..100. */
  score: number;
  /** Display label; not a domain-key replacement. */
  explanation: string;
}

export interface BrainScoreSnapshot {
  snapshotId: string;
  userId: string;
  /** UTC ISO 8601 capture time. */
  capturedAt: string;
  /** Brain-domain protocol version; required for audit. */
  protocolVersion: string;
  mode: BrainScoreMode;
  /** Required when `mode === 'qEEG'` or `'HEG'`. */
  assessorId: string | null;
  domains: ReadonlyArray<BrainDomainScore>;
  /** Default empty; populated only by qualified assessment sources. */
  regionalScores: ReadonlyArray<RegionalScore>;
  /** Default empty; surfaced only in trainer / Phase 4 preview. */
  fiveDScores: ReadonlyArray<Assessment5DScore>;
  /** Localised safety copy identifier; always `wellness_not_diagnosis`. */
  disclaimerKey: 'wellness_not_diagnosis';
}

export const BRAIN_SNAPSHOT_PROTOCOL_VERSION = 'brain-domain-v1' as const;