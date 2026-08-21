# Initial English Knowledge Set (Phase 0)

This file is a **starter set of three entry skeletons**. None of these are approved. They exist to:

1. Demonstrate the `KnowledgeDocument` schema in practice.
2. Give the retrieval layer an initial corpus to test against before clinical / wellness review.
3. Reserve topic coverage for sleep hygiene, relaxation, and SleepOS-specific brain training.

Promotion to `status: "approved"` requires a clinical / wellness reviewer signature in `PROGRESS.md`.

## Entry 1 — Sleep hygiene fundamentals (skeleton)

```yaml
documentId: sleep-hygiene-fundamentals-en-v1
title: Sleep hygiene fundamentals (English)
topic: sleep_hygiene
language: en
sourceUrl: https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html
sourceFile: docs/knowledge/initial-english-set.md
evidenceLevel: regulatory_body
allowedUse:
  - advice_text
  - insight_text
prohibitedClaims:
  - "guarantees better sleep"
  - "treats insomnia"
  - "cures sleep problems"
reviewedBy: pending_external
reviewedAt: null
expiresAt: null
version: "0.1.0-draft"
status: draft
```

Planned chunks (one per section):

- Chunk 1: Consistent sleep and wake times
- Chunk 2: Bedroom environment (light, noise, temperature)
- Chunk 3: Wind-down routine and screen time

Each chunk must be ≤ 800 characters and free of any pattern in `shared/constants/safety.ts` `PROHIBITED_OUTPUT_PATTERNS`.

## Entry 2 — Relaxation breathing (skeleton)

```yaml
documentId: relaxation-breathing-en-v1
title: Slow breathing for relaxation (English)
topic: relaxation
language: en
sourceUrl: pending_source_confirmation
sourceFile: docs/knowledge/initial-english-set.md
evidenceLevel: peer_reviewed
allowedUse:
  - advice_text
prohibitedClaims:
  - "lowers blood pressure"
  - "cures anxiety"
  - "replaces medication"
reviewedBy: pending_external
reviewedAt: null
expiresAt: null
version: "0.1.0-draft"
status: draft
```

Planned chunks:

- Chunk 1: 4-2-6 breathing pattern (matches the P0 breathing session)
- Chunk 2: When to use it
- Chunk 3: When to stop (if dizzy, light-headed, or anxious)

## Entry 3 — SleepOS brain training context (skeleton)

```yaml
documentId: sleepos-brain-training-context-en-v1
title: SleepOS brain training task — context and limits
topic: brain_training
language: en
sourceUrl: internal://sleepos-product
sourceFile: docs/knowledge/initial-english-set.md
evidenceLevel: demo_only
allowedUse:
  - advice_text
  - insight_text
prohibitedClaims:
  - "improves IQ"
  - "treats ADHD"
  - "is a clinical assessment"
  - "is a brain scan"
reviewedBy: pending_internal_product
reviewedAt: null
expiresAt: null
version: "0.1.0-draft"
status: draft
```

Planned chunks:

- Chunk 1: What the reaction-time task measures and what it does NOT measure.
- Chunk 2: How the result compares to your own baseline (not a population).
- Chunk 3: Why we never call it a clinical brain score.

## Phase 3 review backlog

Once the clinical / wellness reviewer is assigned, these three entries become the first review queue. Promoting any of them to `approved` also requires:

- Final canonical source URL on the public internet OR a `internal://` URI with a checksum.
- `reviewedBy` and `reviewedAt` populated.
- `expiresAt` set to ≤ 24 months.
- Computed `contentHash` for each chunk.