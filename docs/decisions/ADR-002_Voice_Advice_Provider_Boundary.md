# ADR-002 — Voice, AI Advice, and TTS Provider Boundary

- Status: Accepted (with Phase 0 contract authors' sign-off; clinical / privacy / security review pending before Phase 1 implementation)
- Date: 2026-08-19
- Owner: `voice_advice_architect`
- Related Task: `docs/tasks/10_Voice_Advice_Contracts.md`

## Context

The voice check-in + AI advice + brain score stream (A2A Voice + Brain Integration Plan, 2026-08-19) introduces three external provider categories that the P0 demo did not depend on:

1. **Speech-to-text (STT)** — primary English transcription;粤语 `yue-Hant-HK` Chirp 2 path already prototyped in `health-voice-checkin-prototype`.
2. **Text analysis / advice generation** — MiniMax family of models for refining deterministic observations into bounded wellness advice.
3. **Text-to-speech (TTS)** — MiniMax TTS for reading validated `speakableText` back to the user.

The P0 contract layer in Task 01 deliberately kept all provider SDKs out of UI and domain code; this ADR confirms the same boundary for the new stream and tightens it with explicit rules:

- Provider identifiers are configuration, not domain constants.
- Raw microphone audio is not persisted by default.
- AI cannot create scores; AI can only explain scores produced by the deterministic scoring service.
- Knowledge content is approved, versioned, and reviewable; fine-tuning is gated behind RAG + evaluation maturity.

## Decision

1. **Provider interfaces live in `shared/schemas/provider-types.ts`** and carry no SDK-specific types. Frontend and backend application code depend on the interfaces only.

2. **Provider selection is environment-driven** via the keys enumerated in `docs/SHARED_KEYS.md` §10 and `shared/constants/provider-config-keys.ts`:
   - `SLEEPOS_PROVIDER_MODE` (`mock` | `live`)
   - `SLEEPOS_STT_PROVIDER`, `SLEEPOS_ADVICE_PROVIDER`, `SLEEPOS_TTS_PROVIDER`
   - `SLEEPOS_STT_DEFAULT_LANGUAGE` (initial `en-US`)
   - `SLEEPOS_VOICE_AUDIO_RETENTION` (default `none`)
   - Provider-secret keys (e.g. `MINIMAX_API_KEY`) are server-only and never logged.

3. **`SpeechToTextProvider`, `AdviceProvider`, `TextToSpeechProvider`** are defined as the canonical interfaces. First adapters:
   - `GoogleSpeechToTextProvider` (en-US primary;保留粤语 code path config but disabled by default)
   - `MockAdviceProvider` (Phase 2 mock; deterministic structured output)
   - `MockTextToSpeechProvider` (Phase 2 mock; returns silence + metadata)
   - `MiniMaxAdviceProvider` and `MiniMaxTextToSpeechProvider` (Phase 3 only after schema + safety evaluation gates pass)

4. **Raw audio default retention is `none`.** Persisting audio requires explicit consent (`SLEEPOS_VOICE_AUDIO_RETENTION=enabled_storage`), bounded retention, encryption, access control, and deletion review. The default is non-negotiable without an independent privacy review.

5. **`ActionType` enum gains an additive `routine` value.** Existing three values (`brain_training`, `breathing`, `sleep_goal`) keep their meaning and wire values. No client in the P0 demo enumerates the enum length; the additive change is forward-compatible. Documented in `docs/SHARED_KEYS.md` §5 change log.

6. **`brain_score_snapshots` is a new table, distinct from `brain_assessments`.** The former is multi-mode functional-domain scores (`demo | self_report | cognitive_task | qEEG | HEG`); the latter is the P0 brain-training protocol aggregate. The two are not interchangeable.

7. **All AI advice output passes through a strict runtime schema validator** (`shared/schemas/advice-output.schema.json`). Any output that fails validation is discarded; the user sees a deterministic safe fallback, never a partial model output.

8. **Safety routing is three-level (`green | amber | red`)** with deterministic phrase / intent rules as the primary signal and the model classifier as a secondary layer. Red routing immediately stops ordinary advice and surfaces the `escalationCopy` identifier; the model cannot override the routing decision.

## Alternatives Considered

- **Option A — Inline provider calls in components.** Rejected: violates CLAUDE.md §9 architecture boundary; couples UI to SDK upgrade cycles; blocks safe offline / mock testing.
- **Option B — Single mega-provider that handles STT + advice + TTS.** Rejected: increases vendor lock-in, removes ability to A/B test individual layers, harder to swap TTS without retraining advice prompts.
- **Option C — Skip provider interfaces, call SDKs directly inside deterministic engine.** Rejected: deterministic engine must remain testable without any provider secrets; mixing it with SDKs makes the safety boundary porous.
- **Option D — Persist raw audio by default for "research."** Rejected: violates PRD §9 privacy baseline and ADR-002 §4; opt-in storage requires consent + retention + encryption + deletion review.
- **Option E — Fine-tune a MiniMax model for SleepOS advice in Phase 1.** Rejected: violates A2A plan §5.3 maturity gate; RAG + eval must mature first.
- **Option F — Add `routine` as a parallel `AdviceActionType` rather than extending `ActionType`.** Rejected: violates CLAUDE.md "one term per concept" rule; `routine` is the same domain concept (a planned user action) and would later require aliasing when the AI advice stream writes back into the Plan via `POST /api/v1/plans/today/actions`.

## Consequences

- **Benefits:**
  - Provider swap is a configuration change, not a code change.
  - Mock mode lets the demo run end-to-end without any external keys.
  - Strict schema validation plus safety routing limits the model's blast radius.
  - Distinct `brain_score_snapshots` keeps regional scoring honest about provenance.
  - No-raw-audio default aligns with PRD §9 and avoids accidental PII retention.
- **Trade-offs:**
  - Slightly more upfront design work for the interface layer.
  - Mock + live provider parity testing must be maintained (mitigated by interface contracts).
  - Additive `routine` enum value changes the `action_type` Postgres enum; migration must extend the type, not replace it.
- **Migration / rollback impact:**
  - No data migration in Phase 0 (no implementation yet).
  - When implementing, all new tables go behind their own migrations `004+` (P0 migrations `001`–`003` remain untouched).
  - `routine` enum value added in the same migration as `voice_sessions` and is backward-compatible with existing rows.
  - Rollback is dropping only the new tables and the new enum value; no P0 row is invalidated.

## Signature

- Authored: `voice_advice_architect | 2026-08-19`
- Reviewer: `independent_review | pending`
- Privacy / Security: `pending_external`
- Clinical / Wellness: `pending_external`