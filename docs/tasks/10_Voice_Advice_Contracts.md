# Task 10 — Voice Check-in, AI Advice, and Brain Score Contracts

## Goal

Author the canonical schemas, enums, allowlists, provider boundaries, and API/data shapes for the **Voice Check-in + MiniMax AI Advice + Brain Score** stream so that Phases 1–5 of `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` can be implemented, reviewed, and audited against one source of truth.

## Priority

- P1 (next major stream after P0 demo)
- Blocks Phase 1 implementation; depends only on Task 01 (Architecture Contracts)

## Scope

### In Scope

1. New canonical contract entities:
   - `voice_sessions`
   - `transcript_segments`
   - `health_checkins`
   - `advice_runs`
   - `advice_items`
   - `brain_score_snapshots`
   - `knowledge_documents`
   - `knowledge_chunks`
   - `model_evaluations`
2. New enums and identifiers in `SHARED_KEYS.md`:
   - `SafetyLevel` (`green` | `amber` | `red`)
   - `VoiceSessionState`, `ProviderMode` (`mock` | `live`)
   - `SttProviderKey`, `AdviceProviderKey`, `TtsProviderKey`
   - `BrainDomain`, `BrainScoreMode`, `BrainScoreQuality`
   - `EvidenceLevel`, `KnowledgeStatus`
   - `EscalationChannel`
   - `VoiceLanguage` (initial `en-US`)
3. New environment variables for provider isolation (no provider name in domain code).
4. `SpeechToTextProvider`, `AdviceProvider`, `TextToSpeechProvider` interfaces in `shared/schemas/provider-types.ts`.
5. Strict runtime schemas (TypeScript types + matching JSON Schema files) for every new entity.
6. Safety taxonomy with copy identifiers (`escalationCopy`, `wellnessScope`, `wellnessDisclaimer` already in P0).
7. ADR-002 capturing the provider boundary, no-raw-audio default, and additive `ActionType = routine` extension.
8. Initial 15–20 safety evaluation cases covering the eight categories in §5.2 of the A2A plan, all marked `expert_review_pending: true`.
9. Knowledge module specification with three entry skeletons marked `approved: false`.

### Out of Scope (Phase 0 boundary)

- Implementing any provider adapter (deferred to Task 11+).
- Running the knowledge base or RAG pipeline.
- Wiring `/check-in` UI or WebSocket endpoints.
- Authentication, RLS, or pilot persistence (deferred to Task 12 / PRD Phase 4).
- Clinically approving the knowledge content or escalation copy (external review required).
- Fine-tuning a model (deferred behind RAG + eval maturity gate per A2A plan §5.3).
-粤语 `yue-Hant-HK` provider path activation (provider adapter保留多語言 config，但 MVP 唔 enable)。

## Dependencies

- **Required:**
  - `docs/tasks/01_Architecture_Contracts.md` (P0 contracts; approved)
  - `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` (source-of-design)
- **Optional:**
  - `docs/PRODUCT_REQUIREMENTS.md` §8 (safety), §13 Phase 4 (bounded AI)
- **Can Run Parallel With:**
  - Task 02 (database migrations will not be executed yet)
  - Task 03 (frontend foundation keeps demo routing unchanged)
- **Blocks:**
  - Voice extraction implementation (Task 11)
  - `/check-in` UI (Task 12)
  - MiniMax advice adapter (Task 13)

## Contracts Affected

- **Database:** new tables in `docs/DATABASE_SCHEMA.md` §10; Postgres enums `safety_level`, `voice_session_state`, `provider_mode`, `brain_domain`, `brain_score_mode`, `brain_score_quality`, `evidence_level`, `knowledge_status`, `escalation_channel`. Additive only.
- **API:** new `/api/v1/voice/*`, `/api/v1/checkins/*`, `/api/v1/advice-runs/*`, `/api/v1/brain-scores/*` endpoints in `docs/API.md` §11. All require `idempotencyKey`, runtime schema validation, owner check, provider timeout, and bounded retry.
- **Shared Keys:** new enums, new identifier `escalationCopy`, new `wellnessScope` copy identifier, new environment variables in `docs/SHARED_KEYS.md` §10.
- **Events:** new analytics events `voice_checkin_started`, `voice_checkin_completed`, `voice_checkin_abandoned`, `advice_run_completed`, `advice_item_accepted`, `escalation_shown` in `docs/SHARED_KEYS.md` §7 (payload allowlist only; no raw audio, no full transcript text).
- **Existing additive change:** `ActionType` enum gains `routine` value; existing three values retain their behaviour. Documented in SHARED_KEYS §5 change log.

## Phased Delivery

### Phase 0 — Author contracts (this task)

- [x] New task file created (this file)
- [x] `docs/decisions/ADR-002_Voice_Advice_Provider_Boundary.md` authored
- [x] `shared/schemas/` populated with TS types + matching JSON Schema
- [x] `shared/constants/` populated with safety, action allowlist, brain domains, voice languages, provider config keys
- [x] `docs/SHARED_KEYS.md` extended additively
- [x] `docs/DATABASE_SCHEMA.md` extended additively (§10)
- [x] `docs/API.md` extended additively (§11)
- [x] `docs/MASTER_PLAN.md` task 10 row added
- [x] `PROGRESS.md` Voice Stream phase entry added
- [x] `tests/evaluations/safety/v0-cases.jsonl` starter set + `README.md`
- [x] `docs/knowledge/README.md` + `docs/knowledge/initial-english-set.md`

### Phase 1 — Extract and harden A2A voice core (Task 11)

- [ ] `SpeechToTextProvider` Google Cloud STT V2 English adapter
- [ ] Transcript segments, confidence, confirm/edit flow
- [ ] Audio limits, timeout, disconnect/resume, provider error mapping

### Phase 2 — SleepOS Voice Check-in experience (Task 12)

- [ ] `/check-in` Next.js UI with mic permission, waveform, transcript review
- [ ] Home `Start voice check-in` CTA
- [ ] Demo repository path; provider-enabled mode via env

### Phase 3 — MiniMax advice + knowledge (Task 13)

- [ ] `AdviceProvider` adapter, `TextToSpeechProvider` adapter
- [ ] Knowledge ingestion / approval / versioning
- [ ] Deterministic scoring + retrieval before model generation
- [ ] Output schema validation, safety router, prompt injection tests
- [ ] Replace starter eval set with full 50–100 expert-reviewed cases

### Phase 4 — Body / Brain visualization (Task 14)

- [ ] Body / Brain segmented control in Explore
- [ ] Functional domain scores + source/date/measured labels
- [ ] 5D dimension view as demo / trainer preview only

### Phase 5 — Pilot persistence and release (Task 15)

- [ ] Authentication, migrations, RLS, consent, retention, export, delete
- [ ] Provider data-region / retention review
- [ ] Independent clinical / privacy / security / accessibility review

## Error / State Requirements

- [ ] `loading` — transcript streaming, advice pending, TTS buffering
- [ ] `empty` — no transcripts yet, no advice items
- [ ] `success` — confirmed session, validated advice, played audio
- [ ] `validation` — confidence below threshold, number/time/negation/medication flagged for user confirmation; ASR rejection (illegal characters, mixed languages beyond config)
- [ ] `permission` — microphone denied, browser unsupported, secure-context required
- [ ] `network / dependency failure` — provider timeout, partial transcript, advice generation fail, TTS fail (text fallback)
- [ ] `safety` — Red level escalation surfaces deterministic copy and blocks advice; Amber level surfaces professional referral copy; Green emits bounded actions
- [ ] `conflict / duplicate` — idempotency key reuse with different payload returns `IDEMPOTENCY_CONFLICT`; same payload returns original success
- [ ] `partial-success` — confirmed text without advice (provider failed); confirmed text + advice without audio (TTS failed); transcript saved with `transcriptStatus: partial`
- [ ] `retry / recovery` — provider retried within bounded budget; UI never silently fills in missing values

## Acceptance Criteria

- [ ] All new TS types compile under the repo's TypeScript config (no `frontend/package.json` install required; types live in `shared/`).
- [ ] All new JSON Schema files validate against a hand-traced example payload for each entity.
- [ ] `docs/SHARED_KEYS.md` lists every new enum value, identifier, and environment variable; change log entry documents additive `ActionType = routine`.
- [ ] `docs/DATABASE_SCHEMA.md` §10 contains one table per entity with FK, indexes, retention note, and RLS prerequisite.
- [ ] `docs/API.md` §11 lists every new endpoint with request/response/example, error codes, idempotency, and ownership rules.
- [ ] `docs/architecture/SYSTEM.md` and `DATA_FLOW.md` are NOT modified by this task (no architecture drift); voice/advice flows are documented inline in the new sections of DATABASE_SCHEMA.md and API.md until a Phase 1 architecture addendum is authored.
- [ ] ADR-002 captures provider boundary, no-raw-audio default, and additive `routine` action type.
- [ ] `tests/evaluations/safety/v0-cases.jsonl` contains at least 15 cases across all eight categories in A2A plan §5.2; each case carries `expert_review_pending: true`.
- [ ] `docs/knowledge/initial-english-set.md` contains three entry skeletons marked `approved: false`.
- [ ] No P0 contract is removed, renamed, or repurposed. Only additive changes.
- [ ] `PROGRESS.md` records the additive conflict flag for `ActionType` and `brain_assessments` vs new `brain_score_snapshots`.

## Validation

- [x] Cross-document trace: each new entity appears in SHARED_KEYS, DATABASE_SCHEMA, API.md, and at least one shared schema file.
- [x] All JSON Schema files validate against a hand-built example object.
- [ ] Unit tests deferred to Task 11 (provider adapters require runtime).
- [ ] E2E tests deferred to Task 12 (UI required).
- [ ] Independent reviewer sign-off required before any Phase 1 implementation begins.
- [ ] Clinical / wellness reviewer sign-off required before any knowledge entry leaves `approved: false`.

## Risks / Notes

| Risk | Mitigation |
|---|---|
| Schema drift between TS type and JSON Schema | One author owns both files per entity; cross-trace in PR review |
| `routine` value added to existing `ActionType` enum could break clients that hard-code length | Documented additive change; no client in P0 demo enumerates the length |
| `brain_score_snapshots` may be confused with `brain_assessments` | Distinct table + distinct identifier + ADR explains the boundary |
| Knowledge items authored without expert review could leak as truth | All entries start `approved: false`; `knowledge_documents.status` cannot reach `approved` without `reviewed_by` and `reviewed_at` |
| Raw audio accidentally persisted | Default `SLEEPOS_VOICE_AUDIO_RETENTION=none`; explicit `enabled_storage: true` required at consent; ADR-002 captures this |
| Provider name leakage into domain code | All provider identifiers read from env via `providerConfigKeys`; interfaces in `shared/schemas/provider-types.ts` carry no SDK type |

## Ownership / Signatures

- Implementer: `voice_advice_architect` (drafted, not yet self-approved)
- Reviewer: `independent_review` (pending)
- Clinical / Wellness reviewer: `pending_external`
- Privacy / Security reviewer: `pending_external`

## Cross-References

- `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` §4–§10 (design source)
- `docs/PRODUCT_REQUIREMENTS.md` §8 (safety), §13 Phase 4 (bounded AI)
- `docs/tasks/01_Architecture_Contracts.md` (P0 contracts baseline)
- `docs/decisions/ADR-002_Voice_Advice_Provider_Boundary.md` (this task's decision record)