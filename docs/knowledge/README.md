# Knowledge Module

Approved-source repository for the AI advice RAG pipeline described in `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` §5. Knowledge content is consumed by `AdviceProvider` only via the validated input in `shared/schemas/advice-input.ts`; the model never receives raw document content.

## Layout

```text
docs/knowledge/
  README.md                  — this file
  initial-english-set.md     — Phase 0 starter skeletons (all approved=false)
  approved/                  — populated after clinical / wellness review
  superseded/                — archived after replacement or expiry
```

## Promotion rules

1. Every entry starts with `status: "draft"`.
3. A reviewer (named in `reviewedBy`) promotes it to `pending_review`.
4. Only a clinical / wellness reviewer promotes to `approved`; `reviewedBy` and `reviewedAt` become mandatory.
5. `withdrawn` and `superseded` are terminal; they remain in the audit trail but are not returned by retrieval.
6. `expiresAt` automatically downgrades status to `expired` at the boundary; retrieval must filter by status.

## Required fields

See `shared/schemas/knowledge-document.schema.json` and `shared/schemas/knowledge-document.ts`.

## Authoring workflow

1. Author (or import) the underlying source; record the canonical URL / file.
2. Draft a chunk skeleton in `initial-english-set.md` (or `approved/` once promoted).
3. Tag the chunk with `topic` from the allowlist in `SHARED_KEYS.md` §6 plus the new topic constants (planned).
4. Record prohibited claims; never include a phrase that matches any pattern in `shared/constants/safety.ts` `PROHIBITED_OUTPUT_PATTERNS`.
5. Compute the `contentHash` for tamper detection.

## Reviewer checklist (clinical / wellness)

- [ ] Source is publicly available, citable, or self-authored SleepOS content.
- [ ] No diagnostic or treatment claims.
- [ ] No medication names / dosing.
- [ ] No claim of efficacy without source.
- [ ] No clinical brain-scan implication for non-medical sources.
- [ ] Language is uncertainty-aware ("may", "can", "is associated with").
- [ ] `evidenceLevel` is honestly assigned.
- [ ] `expiresAt` is set (≤ 24 months).

## Initial English set

See `initial-english-set.md` for three starter entry skeletons. None are promoted until review.