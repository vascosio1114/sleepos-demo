# ADR-003 — Real Provider Integration (Review Override)

- Status: Accepted with explicit override
- Date: 2026-08-19
- Owner: `voice_advice_implementer` (under user directive)
- Related Task: `docs/tasks/11_Voice_Advice_Implementation.md` → real provider phase
- Supersedes: Part of the review-blocked policy in `ADR-002`

## Context

The voice / AI advice / brain score stream is implemented in mock mode (Tasks 10–11) and is runnable as a demo. Per `ADR-002 §6`, real provider integration was held behind five review gates listed in `PROGRESS.md` Phase 5 pending validations:

1. Independent review of Task 10 + Task 11 contracts and implementation
2. Clinical / wellness reviewer sign-off on `wellnessScope` and `escalationCopy`
3. Legal reviewer sign-off on regional emergency hotline (`[REGIONAL_HOTLINE]` placeholder)
4. Privacy / security reviewer sign-off on no-raw-audio default and provider secret handling
5. Knowledge items promoted from `approved: false` to `approved: true`

The user has explicitly chosen to proceed without waiting for those five gates (`review_override: user_directive`). The user takes responsibility for the residual risk and agrees to address any findings as follow-up issues.

## Decision

Wire `MiniMaxAdviceProvider` and `MiniMaxTextToSpeechProvider` adapters against the canonical provider interfaces (`shared/schemas/provider-types.ts`), behind `SLEEPOS_PROVIDER_MODE=live` env config. Mock providers remain the default and the only behaviour under `SLEEPOS_PROVIDER_MODE=mock`.

Mock fallback is preserved at every layer. No real adapter is reachable unless `SLEEPOS_PROVIDER_MODE=live` AND `MINIMAX_API_KEY` is present.

## Alternatives Considered

- **Wait for all 5 gates** — rejected per user directive; still available as a follow-up path.
- **Pilot mode (Task 15)** — out of scope; Supabase / RLS / consent ledger remain future work.
- **Provider-managed fine-tuning** — out of scope per A2A plan §5.3 (RAG + eval maturity gate).

## Consequences

### Benefits

- End-to-end live flow becomes runnable against the user's actual MiniMax account.
- Fail-closed validator still discards malformed model output.
- Knowledge retrieval stays optional; `sourceIds` default to the three starter chunks.
- Browser-native TTS continues to work as the free default; MiniMax TTS is opt-in.

### Trade-offs (residual risk)

- **No clinical / legal sign-off on copy yet.** `wellnessScope` and `escalationCopy` retain `reviewStatus: "pending"`. `[REGIONAL_HOTLINE]` remains a placeholder.
- **No privacy / security audit yet.** Mitigations applied here: no raw audio leaves the browser, all secrets via server-only env, fail-closed validator, redacted logging, bounded timeout, no PII in metric headers.
- **No independent code review.** Reviewer follow-up remains a hard prerequisite for pilot launch per `CLAUDE.md §8`.
- **Knowledge module is empty** (0 approved items). The model relies on its own knowledge + the three placeholder chunks; not a clinical source.
- **Eval suite not yet run against the live model.** The 47-case mechanical suite covers expected behaviour shape but does not validate the live model output. Live eval wiring is a follow-up.
- **The user's chat-shared API key was exposed.** Rotated key must be used; the rotated value goes into `.env.local` only.

### Migration / rollback impact

- Rollback is a one-line env change (`SLEEPOS_PROVIDER_MODE=mock`). No data migration.
- Existing demo state in `localStorage` is unchanged.
- No new tables or migrations.

## Operational rules

1. **Secret hygiene** — `MINIMAX_API_KEY` only via server env. The frontend bundle MUST NOT contain any `NEXT_PUBLIC_MINIMAX_*` or `NEXT_PUBLIC_GOOGLE_*` env names (CI check).
2. **Redaction** — any log line containing `providerConfig` MUST go through `redactConfig()` so the API key never appears.
3. **Bounded timeout** — text generation 8s; TTS 4s (per A2A plan §11.6).
4. **Fail-closed validator** — model output not matching `AdviceOutput` schema is discarded; user sees a deterministic safe fallback. No partial model output ever surfaces.
5. **Audit trail** — each advice run records `promptVersion`, `knowledgeVersion`, `adviceProviderKey`, `safetyReasonCodes` in `AdviceProvenance`. No PII or prompt content.

## Sign-off

- Authored: `voice_advice_implementer | 2026-08-19 | implemented under user directive override`
- Reviewer (independent): `pending_external`
- Privacy / Security: `pending_external`
- Clinical / Wellness: `pending_external`
- Legal: `pending_external`
- Knowledge module reviewer: `pending_external`

Override note: this ADR and the matching `PROGRESS.md` entry carry `review_override: user_directive` so any future audit can see exactly which gates were skipped and why.