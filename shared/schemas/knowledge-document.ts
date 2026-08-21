// Knowledge document and chunk metadata. Source: A2A plan §5.1.
// All knowledge chunks MUST reference an `approved` document; the
// status cannot reach `approved` without `reviewedBy` and `reviewedAt`.

export type KnowledgeEvidenceLevel =
  | 'expert_consensus'
  | 'peer_reviewed'
  | 'regulatory_body'
  | 'industry_guideline'
  | 'manufacturer_material'
  | 'demo_only';

export type KnowledgeStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'superseded'
  | 'withdrawn'
  | 'expired';

export interface KnowledgeDocument {
  documentId: string;
  title: string;
  /** e.g. `sleep_hygiene`, `relaxation`, `brain_training`, `safety_boundary`. */
  topic: string;
  language: string;
  /** Source URL or canonical file path. Never a private link. */
  sourceUrl: string;
  sourceFile: string;
  evidenceLevel: KnowledgeEvidenceLevel;
  /** Allowlist of permitted use cases (e.g. `advice_text`, `insight_text`). */
  allowedUse: ReadonlyArray<string>;
  /** Phrase patterns that must never be cited from this document. */
  prohibitedClaims: ReadonlyArray<string>;
  reviewedBy: string;
  /** UTC ISO 8601. */
  reviewedAt: string;
  /** UTC ISO 8601; null means no expiry. */
  expiresAt: string | null;
  version: string;
  status: KnowledgeStatus;
}

export interface KnowledgeChunk {
  chunkId: string;
  documentId: string;
  /** Stable ordinal within the document. */
  ordinal: number;
  content: string;
  /** Topic tags; allowlisted in SHARED_KEYS §6. */
  topicTags: ReadonlyArray<string>;
  /** Hash for tamper detection. */
  contentHash: string;
}