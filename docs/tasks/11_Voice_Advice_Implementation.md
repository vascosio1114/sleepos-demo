# Task 11 — Voice / AI Advice / Brain Score Implementation (Mock-mode Demo)

## Goal

Build a runnable, demo-testable vertical slice of the voice check-in + AI advice + brain score stream in **mock provider mode** (no Google, MiniMax, or Gemini API keys required). This task delivers items 2–5 of the A2A plan §12 first sprint:

- Transcript confirmation flow that solves the ASR misrecognition risk on numbers, times, and negations.
- Mock `SpeechToTextProvider` (en-US first) with deterministic scenarios matching `tests/evaluations/safety/v0-cases.jsonl`.
- `/check-in` Next.js UI with microphone capture, transcript review, check-in form, advice display, and browser-native TTS playback.
- Mock `AdviceProvider` end-to-end: `voice → transcript → checkin → advice → Insights → Plan`.

Real provider adapters (Google STT V2, MiniMax text/TTS) are deliberately **out of scope** for this task and queued for Task 13 after independent contract review.

## Status

- **State:** Drafted; in progress
- **Priority:** P1
- **Owner:** `voice_advice_implementer`
- **Last updated:** 2026-08-19
- **Builds on:** Task 10 / ADR-002 (contracts approved, awaiting clinical / privacy / independent sign-off)

## Scope

### In Scope

1. Frontend lib module `frontend/src/lib/voice-advice/` with:
   - Entity types mirroring `shared/schemas/*.ts`
   - Safety router, copy identifiers, prohibited phrase list
   - 18 demo scenarios mapped 1:1 from `tests/evaluations/safety/v0-cases.jsonl`
   - Mock STT, mock advice generator, mock TTS metadata generator
   - Client localStorage repository (no real persistence)
   - React context provider
2. Next.js API route handlers under `frontend/src/app/api/v1/`:
   - `POST /api/v1/voice/sessions`
   - `POST /api/v1/voice/sessions/{sessionId}/finish`
   - `PUT /api/v1/voice/sessions/{sessionId}/transcript`
   - `POST /api/v1/checkins`
   - `GET /api/v1/checkins/{checkinId}`
   - `POST /api/v1/advice-runs`
   - `GET /api/v1/advice-runs/{adviceRunId}`
   - `POST /api/v1/advice-runs/{adviceRunId}/speech`
   - `GET /api/v1/brain-scores/current`
   - `GET /api/v1/brain-scores/history`
3. UI:
   - `app/check-in/page.tsx` (landing)
   - `components/check-in-experience.tsx` (active session)
   - Home page: `Start voice check-in` CTA
   - Insights page: latest AI advice run + speakableText + speech playback
   - Profile page: voice history + delete controls
   - Explore: Brain mode tab reading `brain-scores/current`
4. Browser-native TTS via `window.speechSynthesis` (no API key).
5. Real microphone capture via `MediaRecorder` + waveform visualization via `AnalyserNode` + `<canvas>`.
6. Vitest unit tests for the safety router and mock advice generator.
7. Manual test checklist document.

### Out of Scope

- Real Google Cloud Speech-to-Text V2 adapter (Task 13).
- Real MiniMax text / TTS adapter (Task 13).
- Real database persistence, authentication, RLS, consent ledger (Task 15 / Phase 5).
-粤语 `yue-Hant-HK` language path (config reserved; not enabled in MVP).
- WebSocket streaming of PCM chunks (mock returns deterministic segments synchronously on `finish`).
- Audio recording playback to the user (the demo shows a waveform but does not replay audio).
- Model evaluation suite CI wiring (deferred until Task 13 brings real provider).
- Clinical / wellness approval of knowledge content and escalation copy (still pending external review).

## Dependencies

- Task 10 (contracts) — done; this task consumes `shared/schemas/*.ts` as the canonical reference and mirrors the types in `frontend/src/lib/voice-advice/types.ts`.
- Existing P0 demo scaffolding: Next.js 16, React 19, TypeScript strict, `@phosphor-icons/react`.

## Contracts Affected

None — this task consumes existing contracts and produces **no** contract changes. All wire shapes, env keys, and enums are pinned to the Phase 0 contract.

## Phased Delivery

### Phase 1 — Lib + API mock layer

- [x] `frontend/src/lib/voice-advice/types.ts`
- [x] `frontend/src/lib/voice-advice/safety.ts`
- [x] `frontend/src/lib/voice-advice/scenarios.ts`
- [x] `frontend/src/lib/voice-advice/mock-providers.ts`
- [x] `frontend/src/lib/voice-advice/store.ts`
- [x] `frontend/src/lib/voice-advice/api.ts`
- [x] `frontend/src/lib/voice-advice/seed.ts`
- [x] `frontend/src/app/api/v1/_lib/store.ts`
- [x] `frontend/src/app/api/v1/_lib/mock-providers.ts`
- [x] All 10 route handlers under `frontend/src/app/api/v1/`

### Phase 2 — UI

- [x] `frontend/src/lib/voice-advice/voice-advice-provider.tsx`
- [x] `frontend/src/components/check-in-experience.tsx` + module CSS
- [x] `frontend/src/app/check-in/page.tsx`
- [x] Home CTA updated
- [x] Insights wired to latest advice + browser TTS playback
- [x] Profile voice history section
- [x] Explore Brain mode

### Phase 3 — Tests + validation

- [x] `frontend/src/lib/voice-advice/safety.test.ts`
- [x] `frontend/src/lib/voice-advice/mock-providers.test.ts`
- [x] `pnpm lint` pass
- [x] `pnpm typecheck` pass
- [x] `pnpm build` pass
- [x] `pnpm test` pass

### Phase 4 — Documentation

- [x] This task file
- [x] `PROGRESS.md` Phase 5 sub-update
- [x] `docs/development/MANUAL_TEST.md` manual test checklist

## Error / State Requirements

- [x] `loading` — mic permission pending, transcript streaming, advice pending, TTS buffering
- [x] `empty` — no scenarios selected, no transcripts yet, no advice items
- [x] `success` — confirmed session, validated advice, played audio
- [x] `validation` — confidence below threshold flagged for confirmation; missing fields; out-of-range values
- [x] `permission` — microphone denied, browser unsupported, secure-context required
- [x] `network / dependency failure` — mock provider failure path returns deterministic safe fallback; never silent success
- [x] `safety` — Red routing surfaces `escalationCopy` and prevents advice; Amber surfaces `wellnessScope` + professional referral copy; Green emits ≤ 3 bounded `AdviceItem`s
- [x] `conflict / duplicate` — idempotency key reuse with different payload returns `IDEMPOTENCY_CONFLICT`; same payload returns original
- [x] `partial-success` — confirmed text without advice; advice without TTS (browser SpeechSynthesis unavailable)
- [x] `retry / recovery` — `cancel`/`reset` buttons restore clean state without losing confirmed transcript

## Acceptance Criteria

- [x] `pnpm lint` passes with zero errors.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes (existing P0 tests + new voice-advice tests).
- [x] `pnpm build` produces a successful Next.js production build.
- [x] User can open `http://localhost:3000/check-in` and run the full mock flow.
- [x] All 18 demo scenarios trigger the correct safety level and produce a deterministic advice output that matches the expected outcome in `tests/evaluations/safety/v0-cases.jsonl`.
- [x] Low-confidence transcript segments are flagged for user confirmation.
- [x] Numbers, times, and negations are flagged for review before analysis runs.
- [x] Red safety scenarios produce zero advice items and surface `escalationCopy`.
- [x] Browser `speechSynthesis` plays the validated `speakableText`; TTS failure does not lose the advice.
- [x] The 5 self-report fields appear in the check-in form with their documented bounds.
- [x] Routine advice items show in Insights but do not break the existing 3-action Plan.
- [x] No raw audio bytes leave the browser; `SLEEPOS_VOICE_AUDIO_RETENTION=none` is the only supported mode.
- [x] Home CTA `Start voice check-in` is reachable from mobile (390 × 844) and desktop.
- [x] Profile lists recent voice sessions with a delete action that clears the record and quarantines on failure.

## Validation

- [x] Unit tests: safety router (8 cases), mock advice generator (4 cases)
- [x] Lint + typecheck + build
- [x] Manual test checklist runnable from `docs/development/MANUAL_TEST.md`
- [ ] E2E Playwright tests deferred to a follow-up task (Phase 4 of A2A plan; out of MVP)
- [ ] Independent reviewer sign-off required before Task 13 (real providers)

## Risks / Notes

| Risk | Mitigation |
|---|---|
| Mock transcript quality unrealistic | Scenarios copied verbatim from `v0-cases.jsonl`; deterministic; reviewers can flag any drift |
| Browser SpeechSynthesis voice quality differs by platform | Documented in MANUAL_TEST; text fallback always present |
| Real provider integration drift between mock and live | Strict `AdviceOutput` schema; output validator; mock and live adapters share interface |
| Mic permission UX (mobile Safari) | Pre-check `navigator.permissions`; clear error path on denial |
| `routine` advice items confuse users | Clear visual treatment: "Suggested habit" cards in Insights; not added to existing 3-action Plan |
| Schema drift vs `shared/schemas/` | This task mirrors Phase 0 types in `lib/voice-advice/types.ts`; independent reviewer traces both |
| Build breaks because of Next.js API route conventions | API routes use App Router handler signatures; verified by `pnpm build` |

## Ownership / Signatures

- Implementer: `voice_advice_implementer | 2026-08-19 | drafted, not independently approved`
- Reviewer: `independent_review | pending`
- Clinical / Wellness: `pending_external`
- Privacy / Security: `pending_external`

## Cross-References

- `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` §11 Phase 0–2, §12 sprint items 2–5
- `docs/tasks/10_Voice_Advice_Contracts.md`
- `docs/decisions/ADR-002_Voice_Advice_Provider_Boundary.md`
- `shared/schemas/*.ts` (Phase 0 canonical contracts)
- `tests/evaluations/safety/v0-cases.jsonl` (18 scenarios)
- `docs/development/MANUAL_TEST.md` (manual test checklist, authored in Phase 4 of this task)