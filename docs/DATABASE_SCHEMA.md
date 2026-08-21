# SleepOS Canonical Database Schema

## 1. Persistence Boundary

No database is required for the P0 competition MVP. P0 uses the canonical synthetic seed plus a versioned local snapshot. The relational schema below is the approved naming and integrity target for the optional Phase 4 Supabase/Postgres adapter; it is not authorization to create a shared-project migration or accept real health data.

Before Supabase activation, the database owner must confirm environment/project isolation, region, retention, deletion, backup, migration ledger, rollback, and RLS tests. Demo rows and real-user rows must not share an environment.

Conventions:

- Tables/columns: `snake_case`; API/frontend: mapped `camelCase` keys from `SHARED_KEYS.md`.
- IDs: UUID generated server-side/database-side, except synthetic `demo_001` is only a local demo ID and is never inserted into the real-user schema.
- Stored timestamps: `timestamptz` in UTC. Daily grouping: `local_date date` plus profile IANA `timezone`.
- Scores are integers from 0-100 unless explicitly documented.
- Sensitive wellness tables are user-owned and inaccessible anonymously.
- `updated_at` is maintained by a reviewed trigger or explicit application write; one method must be selected consistently in migration 001.

## 2. PostgreSQL Enums

| Type | Values |
|---|---|
| `wellness_status` | `good`, `attention`, `no_data`, `completed` |
| `data_source_type` | `demo`, `wearable`, `assessment`, `questionnaire`, `user_entry`, `record`, `derived` |
| `source_connection_status` | `connected`, `demo`, `simulated`, `not_connected` |
| `action_type` | `brain_training`, `breathing`, `sleep_goal` |
| `action_state` | `pending`, `active`, `completed` |
| `session_type` | `brain_training`, `breathing` |
| `session_state` | `active`, `paused`, `completed`, `abandoned` |
| `breathing_feedback` | `better`, `same`, `worse` |
| `insight_generator` | `deterministic_rule`, `ai_refined` |
| `record_status` | `demo`, `simulated`, `metadata_only`, `available`, `deleted` |

`completed` in `wellness_status` is only for action-completion presentation; health metric rows use `good`, `attention`, or `no_data`.

## 3. Tables

### `profiles`

| Column | Type | Null | Default / constraints | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | PK; references auth subject by deployment contract | User owner ID |
| `display_name` | `text` | No | length 1-80 | Display name |
| `age_years` | `smallint` | Yes | check 18-120 | Optional coarse age; no birth date in MVP |
| `timezone` | `text` | No | valid supported IANA zone | Daily-boundary timezone |
| `units_system` | `text` | No | `metric` or `imperial`; default `metric` | Display preference |
| `consent_policy_version` | `text` | Yes | length <= 40 | Accepted real-data policy version |
| `consented_at` | `timestamptz` | Yes | both consent fields null or both set | Consent timestamp |
| `created_at` | `timestamptz` | No | `now()` | Creation time |
| `updated_at` | `timestamptz` | No | `now()` | Last update |

### `daily_metric_snapshots`

One aggregate snapshot per user/local day/source. Null metrics represent unavailable values and must not be imputed silently.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `local_date` | `date` | No | — |
| `source_type` | `data_source_type` | No | — |
| `source_reference` | `text` | Yes | opaque identifier, length <= 120 |
| `measured_at` | `timestamptz` | No | — |
| `sleep_minutes` | `smallint` | Yes | check 0-1440 |
| `sleep_quality_score` | `smallint` | Yes | check 0-100 |
| `hrv_ms` | `numeric(6,2)` | Yes | check 0-500 |
| `resting_heart_rate_bpm` | `smallint` | Yes | check 20-250 |
| `spo2_percent` | `numeric(5,2)` | Yes | check 0-100 |
| `respiratory_rate_per_min` | `numeric(5,2)` | Yes | check 0-100 |
| `stress_score` | `smallint` | Yes | check 0-10 |
| `attention_score` | `smallint` | Yes | check 0-100 |
| `memory_score` | `smallint` | Yes | check 0-100 |
| `reaction_time_ms` | `integer` | Yes | check 50-5000 |
| `muscle_recovery_score` | `smallint` | Yes | check 0-100 |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

Unique: `(user_id, local_date, source_type, source_reference)` with null-safe handling defined in migration (for example `NULLS NOT DISTINCT`).

### `brain_assessments`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `protocol_version` | `text` | No | length 1-40 |
| `state` | `session_state` | No | only completed/abandoned accepted |
| `attention_score` | `smallint` | Yes | check 0-100 |
| `memory_score` | `smallint` | Yes | check 0-100 |
| `reaction_time_ms` | `integer` | Yes | check 50-5000 |
| `started_at` | `timestamptz` | No | — |
| `completed_at` | `timestamptz` | Yes | >= `started_at` |
| `created_at` | `timestamptz` | No | `now()` |

### `questionnaire_responses`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `questionnaire_key` | `text` | No | allowlisted key, length <= 60 |
| `schema_version` | `text` | No | length <= 40 |
| `answers` | `jsonb` | No | object; runtime schema validated; <= 16 KiB |
| `completed_at` | `timestamptz` | No | — |
| `created_at` | `timestamptz` | No | `now()` |

JSON is used only because questionnaire shapes are versioned; secrets, files, and unrestricted free text are prohibited in MVP responses.

### `daily_plans`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `local_date` | `date` | No | — |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

Unique: `(user_id, local_date)`.

### `plan_actions`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `plan_id` | `uuid` | No | FK `daily_plans.id` on delete cascade |
| `action_type` | `action_type` | No | — |
| `priority` | `smallint` | No | check 1-3 |
| `state` | `action_state` | No | default `pending` |
| `target_time_local` | `time` | Yes | allowed only for `sleep_goal` |
| `completed_at` | `timestamptz` | Yes | required iff state is `completed` |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

Unique: `(plan_id, action_type)` and `(plan_id, priority)`. A deferred constraint trigger or transaction-level domain validation enforces no more than three actions and contiguous priorities. `active -> pending` is allowed only as the recovery result of abandoning/restarting a session; completed actions do not reopen in MVP.

### `intervention_sessions`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK; may be client-generated |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `plan_action_id` | `uuid` | No | FK `plan_actions.id` on delete restrict |
| `session_type` | `session_type` | No | must match plan action type |
| `state` | `session_state` | No | default `active` |
| `protocol_version` | `text` | No | length 1-40 |
| `duration_seconds` | `integer` | Yes | check 1-7200 |
| `reaction_time_ms` | `integer` | Yes | brain only; check 50-5000 |
| `accuracy_percent` | `numeric(5,2)` | Yes | brain only; check 0-100 |
| `missed_responses` | `integer` | Yes | brain only; check >= 0 |
| `completed_trials` | `integer` | Yes | brain only; check >= 0 |
| `baseline_reaction_time_ms` | `integer` | Yes | brain only; check 50-5000 |
| `completed_cycles` | `integer` | Yes | breathing only; check >= 0 |
| `breathing_feedback` | `breathing_feedback` | Yes | breathing only |
| `started_at` | `timestamptz` | No | — |
| `completed_at` | `timestamptz` | Yes | required for completed; >= started |
| `abandoned_at` | `timestamptz` | Yes | required for abandoned; >= started |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

Check constraints enforce mutually exclusive result fields by `session_type`, terminal timestamp consistency, and non-negative counts. Aggregate results only; raw stimulus/input events are not persisted.

### `insights`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `local_date` | `date` | No | — |
| `status` | `wellness_status` | No | `good`, `attention`, or `no_data` only |
| `headline` | `text` | No | length 1-160 |
| `what_changed` | `text` | No | length 1-500 |
| `what_happened_alongside` | `text` | No | length 1-500 |
| `possible_relationship` | `text` | No | length 1-500 |
| `next_action` | `text` | No | length 1-300 |
| `action_type` | `action_type` | Yes | — |
| `rule_ids` | `text[]` | No | non-empty allowlisted IDs |
| `comparison_window` | `text` | No | allowlisted key |
| `evidence_metric_keys` | `text[]` | No | allowlisted metric keys |
| `generated_by` | `insight_generator` | No | default deterministic |
| `generated_at` | `timestamptz` | No | — |
| `created_at` | `timestamptz` | No | `now()` |

Unique: `(user_id, local_date)` for the single prioritized MVP insight. AI refinement never replaces the deterministic rule/evidence fields.

### `connected_sources`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `source_key` | `text` | No | allowlisted key, length <= 60 |
| `source_type` | `data_source_type` | No | — |
| `status` | `source_connection_status` | No | — |
| `last_synced_at` | `timestamptz` | Yes | must be null unless truly connected/demo-dated |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

Unique: `(user_id, source_key)`. Provider tokens are not stored in this table.

### `record_metadata`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `record_type` | `text` | No | allowlisted key, length <= 60 |
| `status` | `record_status` | No | — |
| `observed_on` | `date` | Yes | — |
| `display_label` | `text` | No | safe label, length <= 120 |
| `storage_object_key` | `text` | Yes | forbidden until upload review enables storage |
| `created_at` | `timestamptz` | No | `now()` |
| `deleted_at` | `timestamptz` | Yes | set when status is deleted |

P0/P1 demo uses metadata only. File bytes, parsing, and upload endpoints are out of scope until a separate security review.

### `user_feedback`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `feedback_type` | `text` | No | `insight_useful` or `consultation_interest` |
| `subject_id` | `uuid` | Yes | optional referenced domain ID, validated in service |
| `rating` | `smallint` | Yes | check 1-5 |
| `contact_requested` | `boolean` | Yes | — |
| `created_at` | `timestamptz` | No | `now()` |

No unrestricted free-text feedback is stored in MVP.

### `idempotency_records`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `operation` | `text` | No | allowlisted operation key |
| `idempotency_key` | `uuid` | No | client/request key |
| `request_hash` | `text` | No | cryptographic hash; no raw request body |
| `resource_id` | `uuid` | Yes | created/affected resource |
| `response_status` | `smallint` | No | successful HTTP-equivalent status |
| `created_at` | `timestamptz` | No | `now()` |
| `expires_at` | `timestamptz` | No | bounded retention |

Unique: `(user_id, operation, idempotency_key)`. Only successful committed operations are recorded in the same transaction as their domain mutation.

## 4. Relationships

```text
profiles 1--* daily_metric_snapshots
profiles 1--* brain_assessments
profiles 1--* questionnaire_responses
profiles 1--* daily_plans 1--* plan_actions 1--* intervention_sessions
profiles 1--* insights
profiles 1--* connected_sources
profiles 1--* record_metadata
profiles 1--* user_feedback
profiles 1--* idempotency_records
```

Service logic verifies that an intervention session's `user_id`, plan action, and parent plan all have the same owner. A database trigger/constraint or transaction function should enforce this invariant before pilot activation.

## 5. Required Indexes

| Index | Columns | Reason |
|---|---|---|
| `daily_metrics_user_date_idx` | `(user_id, local_date desc)` | Current and 7-day trend reads |
| `assessments_user_completed_idx` | `(user_id, completed_at desc)` | Baseline/latest assessment |
| `plans_user_date_uq` | unique `(user_id, local_date)` | Today's plan lookup |
| `plan_actions_plan_priority_uq` | unique `(plan_id, priority)` | Stable ordering |
| `plan_actions_plan_type_uq` | unique `(plan_id, action_type)` | Add-once behavior |
| `sessions_user_started_idx` | `(user_id, started_at desc)` | Bounded history |
| `sessions_action_idx` | `(plan_action_id, started_at desc)` | Action/session resolution |
| `insights_user_date_uq` | unique `(user_id, local_date)` | Current top insight |
| `sources_user_key_uq` | unique `(user_id, source_key)` | Source status lookup |
| `records_user_observed_idx` | `(user_id, observed_on desc)` where `deleted_at is null` | Bounded record metadata list |
| `idempotency_expiry_idx` | `(expires_at)` | Retention cleanup |

All list queries require explicit limits; session/record history maximum page size is 50.

## 6. RLS and Permissions (Required Before Real Data)

- Enable and force RLS on every user-owned table.
- Authenticated users may select/update their own `profiles` row and CRUD only rows whose `user_id = auth.uid()`.
- Child-table policies must verify ownership through the parent; possession of a UUID is never sufficient.
- Anonymous access receives no real-data policy.
- Inserts cannot choose another `user_id`; server/auth context supplies it.
- Service-role use is restricted to server/admin operations and is never exposed to client code.
- RLS tests must cover anonymous denial, own-row CRUD, cross-user denial, forged parent IDs, nested relations, and deletes.

Authorization remains in server services even when RLS exists; RLS is defense in depth.

## 7. Retention, Export, and Deletion

Exact pilot retention is an open decision and blocks real data. Minimum contract:

- P0 local demo: user can reset; cap history at 50 sessions and 30 daily snapshots.
- Idempotency records: proposed 24-hour minimum, 7-day maximum unless operational evidence requires more.
- Logs/analytics: no raw sensitive values; provider retention must be approved before activation.
- User deletion: one verified request deletes/cascades owned structured data and queues deletion of any separately stored object; completion is auditable without retaining deleted health content.
- Export: structured user-owned data only, with identity verification and bounded generation; required before pilot use.

## 8. Migration Plan

| Version | Scope | Status | Rollback |
|---|---|---|---|
| `001` | Enums, tables, constraints, indexes, timestamp mechanism | Contract only; not implemented | Drop only in an isolated empty environment |
| `002` | RLS enablement and user-ownership policies | Contract only; not implemented | Revoke access before policy rollback; never expose tables |
| `003` | Synthetic development seed in local/dev environment only | Contract only; not implemented | Delete seed rows by fixed dev seed IDs |

No migration has been executed. Before execution: inspect target project and migration ledger, test up/down behavior in an isolated database, snapshot if needed, and document the exact target. Never run `migrate deploy` against an unverified shared Supabase project.

## 9. Local Demo Snapshot Mapping

`sleepos.demo.v1` is a browser-storage document, not a database mirror. It stores only:

- schema version and synthetic demo ID;
- today's plan/action mutations;
- at most 50 aggregate intervention sessions;
- explicit sleep-goal confirmation;
- timestamps needed to derive progress.

Canonical daily metrics and source labels remain seed-owned and are not accepted from untrusted snapshot mutations. Snapshot parsing uses shared runtime schemas; incompatible or corrupt data resets safely.

Independent database/security review remains pending. No schema is approved for real user data yet.

---

## 10. Voice, AI Advice, and Brain Score (Task 10 — Additive Stream)

This section adds the entities required by `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md`. Every table here is **additive**: no P0 row is invalidated, the `action_type` enum gains an additional value (`routine`), and a new enum family is introduced. No migration is executed until the Phase 5 security/privacy gate is approved.

### 10.1 New PostgreSQL Enums

| Type | Values |
|---|---|
| `safety_level` | `green`, `amber`, `red` |
| `safety_reason_code` | `crisis_self_harm`, `crisis_medical_emergency`, `diagnosis_request`, `medication_change_request`, `sustained_decline_self_report`, `conflicting_metric_signals`, `minor_low_risk_wellness`, `no_signals` |
| `voice_session_state` | `requested`, `opening`, `recording`, `transcribing`, `awaiting_confirmation`, `confirmed`, `analyzing`, `awaiting_advice`, `speaking`, `completed`, `abandoned`, `failed` |
| `provider_mode` | `mock`, `live` |
| `stt_provider_key` | `mock`, `google_stt_v2`, `gemini_live` |
| `advice_provider_key` | `mock`, `minimax` |
| `tts_provider_key` | `mock`, `minimax_tts` |
| `voice_language` | `en-US`, `en-GB`, `zh-HK`, `yue-Hant-HK` |
| `brain_domain` | `attention`, `regulation`, `memory`, `sleep_arousal` |
| `brain_score_mode` | `demo`, `self_report`, `cognitive_task`, `qEEG`, `HEG` |
| `brain_score_quality` | `acceptable`, `marginal`, `poor`, `unverified` |
| `evidence_level` | `expert_consensus`, `peer_reviewed`, `regulatory_body`, `industry_guideline`, `manufacturer_material`, `demo_only` |
| `knowledge_status` | `draft`, `pending_review`, `approved`, `superseded`, `withdrawn`, `expired` |
| `checkin_source` | `voice_confirmed`, `manual_entry` |
| `voice_audio_retention` | `none`, `enabled_storage`, `research_grant` |

The existing `action_type` enum gains an additive value:

```sql
ALTER TYPE action_type ADD VALUE 'routine';
```

This is forward-compatible — existing three values keep their wire representation.

### 10.2 Tables

#### `voice_sessions`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK; client-generatable |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `state` | `voice_session_state` | No | — |
| `stt_provider_key` | `stt_provider_key` | No | — |
| `provider_mode` | `provider_mode` | No | — |
| `language` | `voice_language` | No | — |
| `audio_retention` | `voice_audio_retention` | No | default `none` |
| `started_at` | `timestamptz` | No | — |
| `completed_at` | `timestamptz` | Yes | `>= started_at` |
| `abandoned_at` | `timestamptz` | Yes | `>= started_at` |
| `duration_seconds` | `integer` | Yes | check 1..7200 |
| `confirmed_segment_count` | `smallint` | No | default 0, check >= 0 |
| `flagged_segment_count` | `smallint` | No | default 0, check >= 0 |
| `schema_version` | `text` | No | length 1..40 |
| `notes` | `jsonb` | No | default `'[]'`; audit-only; no raw audio |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

**Raw audio is NEVER stored in this table.** The default `audio_retention` is `none`; any other value requires an `audio_storage_consent_id` row in a future consent ledger (Phase 5).

Indexes:

- `voice_sessions_user_started_idx` `(user_id, started_at desc)`
- `voice_sessions_state_idx` `(state)` where `state not in ('completed','abandoned','failed')`

#### `transcript_segments`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `session_id` | `uuid` | No | FK `voice_sessions.id` on delete cascade |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade (denormalised for RLS) |
| `ordinal` | `smallint` | No | check >= 0 |
| `text` | `text` | No | length 1..240; **only persisted when `is_confirmed = true`** |
| `language` | `voice_language` | No | — |
| `confidence` | `numeric(4,3)` | No | check 0..1 |
| `started_at_ms` | `integer` | No | check >= 0 |
| `ended_at_ms` | `integer` | No | `>= started_at_ms` |
| `is_confirmed` | `boolean` | No | must be `true` for storage |
| `user_edited` | `boolean` | No | — |
| `provider_meta` | `jsonb` | Yes | bounded; never contains audio |
| `created_at` | `timestamptz` | No | `now()` |

Indexes:

- `transcript_segments_session_ordinal_uq` unique `(session_id, ordinal)`
- `transcript_segments_user_created_idx` `(user_id, created_at desc)`

A check constraint enforces `is_confirmed = true` (segments without user confirmation must never be persisted).

#### `health_checkins`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `local_date` | `date` | No | — |
| `schema_version` | `text` | No | constant `health-checkin-v1` |
| `source` | `checkin_source` | No | — |
| `captured_at` | `timestamptz` | No | — |
| `sleep_quality_score` | `smallint` | Yes | check 0..100 |
| `sleep_minutes` | `smallint` | Yes | check 0..1440 |
| `stress_score` | `smallint` | Yes | check 0..10 |
| `mood_score` | `smallint` | Yes | check 0..10 |
| `focus_score` | `smallint` | Yes | check 0..100 |
| `confirmed_note` | `text` | Yes | length 1..600 |
| `source_segment_ids` | `uuid[]` | Yes | references `transcript_segments.id`; soft FK validated at service layer |
| `created_at` | `timestamptz` | No | `now()` |

Unique: `(user_id, local_date)`. The five self-report fields map to the existing canonical metric ranges from `SHARED_KEYS.md` §3.

#### `advice_runs`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `session_id` | `uuid` | Yes | FK `voice_sessions.id` on delete set null |
| `checkin_id` | `uuid` | Yes | FK `health_checkins.id` on delete set null |
| `advice_provider_key` | `advice_provider_key` | No | — |
| `provider_mode` | `provider_mode` | No | — |
| `prompt_version` | `text` | No | length 1..40 |
| `knowledge_version` | `text` | No | length 1..40 |
| `safety_level` | `safety_level` | No | — |
| `safety_reason_codes` | `safety_reason_code[]` | No | non-empty |
| `status` | `text` | No | `pending` \| `succeeded` \| `failed_safe_fallback` |
| `started_at` | `timestamptz` | No | — |
| `completed_at` | `timestamptz` | Yes | `>= started_at` |
| `latency_ms` | `integer` | Yes | check >= 0 |
| `created_at` | `timestamptz` | No | `now()` |

**Never stores:** raw prompt text containing user content; provider API keys; full transcript text. May store bounded hashed identifiers.

Indexes:

- `advice_runs_user_started_idx` `(user_id, started_at desc)`
- `advice_runs_status_idx` `(status)` where `status <> 'succeeded'`

#### `advice_items`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `advice_run_id` | `uuid` | No | FK `advice_runs.id` on delete cascade |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `ordinal` | `smallint` | No | check 1..3 |
| `action_type` | `action_type` | No | includes new `routine` value |
| `routine_key` | `text` | Yes | allowlisted `RoutineKey` from SHARED_KEYS §5; required when `action_type = 'routine'` |
| `title` | `text` | No | length 1..80 |
| `reason` | `text` | No | length 1..240 |
| `duration_minutes` | `smallint` | No | check 0..60 |
| `risk_level` | `text` | No | constant `low` (allowlist enforced) |
| `source_ids` | `text[]` | No | references `knowledge_documents.document_id` (soft FK) |
| `accepted_at` | `timestamptz` | Yes | set when user adds the item to Plan |
| `created_at` | `timestamptz` | No | `now()` |

Unique: `(advice_run_id, ordinal)`. A deferred constraint enforces at most three items per `advice_run_id`.

#### `brain_score_snapshots`

Distinct from `brain_assessments` (P0 brain-training protocol aggregate). This table captures multi-mode functional-domain scores with explicit `mode` provenance.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK `profiles.id` on delete cascade |
| `protocol_version` | `text` | No | constant `brain-domain-v1` |
| `mode` | `brain_score_mode` | No | — |
| `assessor_id` | `text` | Yes | required when `mode in ('qEEG','HEG')`; length 1..64 |
| `captured_at` | `timestamptz` | No | — |
| `domains` | `jsonb` | No | array of `{key, score, status, measured, sourceMetricKeys, quality}` |
| `regional_scores` | `jsonb` | No | default `'[]'`; populated only by qualified assessment sources |
| `five_d_scores` | `jsonb` | No | default `'[]'`; surfaced only in trainer preview |
| `disclaimer_key` | `text` | No | constant `wellness_not_diagnosis` |
| `created_at` | `timestamptz` | No | `now()` |

Indexes:

- `brain_snapshots_user_captured_idx` `(user_id, captured_at desc)`
- `brain_snapshots_mode_idx` `(mode)`

`regional_scores` MUST be an empty array unless the row's `mode ∈ {qEEG, HEG}` and `assessor_id` is non-null. Enforced via row-level CHECK.

#### `knowledge_documents`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `text` | No | PK; canonical slug |
| `title` | `text` | No | length 1..200 |
| `topic` | `text` | No | allowlisted topic tag |
| `language` | `text` | No | BCP-47 |
| `source_url` | `text` | No | length 1..400 |
| `source_file` | `text` | No | length 1..200 |
| `evidence_level` | `evidence_level` | No | — |
| `allowed_use` | `text[]` | No | non-empty |
| `prohibited_claims` | `text[]` | No | default `'{}'` |
| `reviewed_by` | `text` | Yes | required when `status = 'approved'` |
| `reviewed_at` | `timestamptz` | Yes | required when `status = 'approved'` |
| `expires_at` | `timestamptz` | Yes | nullable |
| `version` | `text` | No | length 1..40 |
| `status` | `knowledge_status` | No | — |
| `created_at` | `timestamptz` | No | `now()` |
| `updated_at` | `timestamptz` | No | `now()` |

CHECK: `status = 'approved'` requires non-null `reviewed_by` and `reviewed_at`.

#### `knowledge_chunks`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `text` | No | PK; slug + ordinal |
| `document_id` | `text` | No | FK `knowledge_documents.id` on delete cascade |
| `ordinal` | `smallint` | No | check >= 0 |
| `content` | `text` | No | length 1..1200 |
| `topic_tags` | `text[]` | No | allowlisted |
| `content_hash` | `text` | No | SHA-256 hex |
| `embedding` | `vector(1536)` | Yes | optional; pgvector; only on providers that support it |
| `created_at` | `timestamptz` | No | `now()` |

Unique: `(document_id, ordinal)`. The chunk is rejected if its `document_id` row has `status <> 'approved'`.

#### `model_evaluations`

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | No | PK |
| `advice_provider_key` | `advice_provider_key` | No | — |
| `model_id` | `text` | No | length 1..80 |
| `prompt_version` | `text` | No | length 1..40 |
| `knowledge_version` | `text` | No | length 1..40 |
| `suite_path` | `text` | No | path to the JSONL suite |
| `suite_version` | `text` | No | length 1..40 |
| `total_cases` | `integer` | No | check >= 0 |
| `passed_cases` | `integer` | No | check 0..total_cases |
| `failed_case_ids` | `text[]` | Yes | non-empty when `passed_cases < total_cases` |
| `started_at` | `timestamptz` | No | — |
| `completed_at` | `timestamptz` | No | `>= started_at` |
| `created_at` | `timestamptz` | No | `now()` |

Indexes:

- `model_evals_provider_prompt_idx` `(advice_provider_key, prompt_version, knowledge_version)`

### 10.3 Relationships

```text
profiles 1--* voice_sessions 1--* transcript_segments
profiles 1--* health_checkins 1--* advice_runs 1--* advice_items
profiles 1--* brain_score_snapshots
knowledge_documents 1--* knowledge_chunks
```

`health_checkins` and `advice_runs` are loosely linked to `voice_sessions` via nullable FKs (a check-in may exist without a session, and an advice run may exist without a check-in if it was triggered from deterministic rules alone).

### 10.4 Required Indexes

| Index | Columns | Reason |
|---|---|---|
| `voice_sessions_user_started_idx` | `(user_id, started_at desc)` | Session history |
| `voice_sessions_state_idx` | partial `(state)` where active | Recovery sweeps |
| `transcript_segments_session_ordinal_uq` | unique `(session_id, ordinal)` | Ordered playback |
| `transcript_segments_user_created_idx` | `(user_id, created_at desc)` | Audit lookup |
| `health_checkins_user_date_uq` | unique `(user_id, local_date)` | One checkin per day |
| `advice_runs_user_started_idx` | `(user_id, started_at desc)` | History |
| `advice_items_run_ordinal_uq` | unique `(advice_run_id, ordinal)` | Stable list |
| `brain_snapshots_user_captured_idx` | `(user_id, captured_at desc)` | Current + history |
| `brain_snapshots_mode_idx` | `(mode)` | Filter demo / qEEG |
| `knowledge_chunks_document_ordinal_uq` | unique `(document_id, ordinal)` | Stable chunk order |
| `model_evals_provider_prompt_idx` | `(advice_provider_key, prompt_version, knowledge_version)` | Regression lookup |

### 10.5 RLS and Retention (Phase 5 Gate)

- RLS policies mirror §6 patterns: every user-owned table is `enable row level security` and `force row level security`.
- `transcript_segments.user_id` is denormalised so RLS can evaluate without traversing to `voice_sessions`.
- No raw audio bytes are ever stored; the `audio_retention` column documents the policy only.
- `knowledge_documents.status = 'approved'` rows are public-readable to all authenticated users (knowledge is non-personal); non-approved rows are visible only to reviewers.
- `model_evaluations` rows are admin-only.
- Retention defaults (subject to legal review):
  - `voice_sessions` + `transcript_segments`: 90 days unless user deletes sooner.
  - `health_checkins` + `advice_runs` + `advice_items`: 12 months.
  - `brain_score_snapshots`: 24 months.
  - `knowledge_documents` + `knowledge_chunks`: until `withdrawn` + 12 months audit tail.
  - `model_evaluations`: 24 months.
- Pilot activation requires the retention values above to be confirmed by Privacy / Security reviewer.

### 10.6 Migration Plan (additive)

| Version | Scope | Rollback |
|---|---|---|
| `004` | New enums; `action_type` additive `routine` value; tables `voice_sessions`, `transcript_segments`, `health_checkins`, `advice_runs`, `advice_items`, `brain_score_snapshots`, `knowledge_documents`, `knowledge_chunks`, `model_evaluations`; indexes; constraints | Drop new tables in empty environment; cannot remove `routine` enum value once committed (use `IF EXISTS` rename strategy instead) |
| `005` | RLS enablement and user-ownership policies for new tables | Revoke access before rollback |

No migration is executed before Phase 5 privacy/security review.
