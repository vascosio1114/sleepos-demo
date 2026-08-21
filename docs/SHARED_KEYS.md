# SleepOS Shared Keys Registry

> Change log (additive; no breaking renames):
> - 2026-08-19 — Task 10 / ADR-002: new voice / advice / brain-score enums; new env keys; additive `ActionType = routine`; new safety / escalation copy identifiers.

## 1. Rules

- This is the canonical registry for names crossing UI, domain, API, persistence, tests, analytics, and integrations.
- TypeScript/API keys use `camelCase`; Postgres uses the mapped `snake_case` name.
- Enum wire values are lowercase `snake_case` and are never localized. UI labels may be localized separately.
- Storage/API timestamps are ISO 8601 UTC; local day keys are `YYYY-MM-DD`; local time targets are 24-hour `HH:mm`.
- Measurements carry the units named below; bare ambiguous values are prohibited.
- New shared names must be added here before or with implementation.

## 2. Identity, Time, and Provenance

| Concept | Canonical key | Database | Type/format | Notes |
|---|---|---|---|---|
| User/profile ID | `userId` | `user_id` | UUID | Server-derived in real mode |
| Synthetic demo ID | `demoUserId` | n/a | literal `demo_001` | Never an authenticated identity |
| Display name | `displayName` | `display_name` | string 1-80 | Alex in seed |
| Age in years | `ageYears` | `age_years` | integer 18-120/null | MVP avoids date of birth |
| IANA timezone | `timezone` | `timezone` | string | Required for daily boundary |
| Local date | `localDate` | `local_date` | `YYYY-MM-DD` | Not a UTC timestamp |
| Local target time | `targetTimeLocal` | `target_time_local` | `HH:mm` | Sleep goal only |
| Measurement time | `measuredAt` | `measured_at` | ISO 8601 UTC | Provenance/freshness |
| Created time | `createdAt` | `created_at` | ISO 8601 UTC | — |
| Updated time | `updatedAt` | `updated_at` | ISO 8601 UTC | — |
| Started time | `startedAt` | `started_at` | ISO 8601 UTC | — |
| Completed time | `completedAt` | `completed_at` | ISO 8601 UTC/null | — |
| Source type | `sourceType` | `source_type` | `DataSourceType` | Provenance category |
| Source reference | `sourceReference` | `source_reference` | opaque string/null | Never a secret/token |

## 3. Metric Keys and Units

| Display concept | API/frontend key | Database | Unit/range | Alex current/baseline |
|---|---|---|---|---|
| Sleep duration | `sleepMinutes` | `sleep_minutes` | integer minutes, 0-1440 | 378 / 430 |
| Sleep quality | `sleepQualityScore` | `sleep_quality_score` | integer 0-100 | 61 / null |
| Heart-rate variability | `hrvMs` | `hrv_ms` | milliseconds, 0-500 | 42 / 48 |
| Resting heart rate | `restingHeartRateBpm` | `resting_heart_rate_bpm` | beats/min, 20-250 | 72 / null |
| Oxygen saturation | `spo2Percent` | `spo2_percent` | percent, 0-100 | 98 / null |
| Respiratory rate | `respiratoryRatePerMin` | `respiratory_rate_per_min` | breaths/min, 0-100 | 14 / null |
| Stress | `stressScore` | `stress_score` | integer 0-10 | 7 / null |
| Attention | `attentionScore` | `attention_score` | integer 0-100 | 78 / null |
| Memory | `memoryScore` | `memory_score` | integer 0-100 | 82 / null |
| Reaction time | `reactionTimeMs` | `reaction_time_ms` | integer milliseconds, 50-5000 | 312 / 291 |
| Stress regulation | `stressRegulationScore` | derived/not stored P0 | integer 0-100 | 64 / null |
| Muscle recovery | `muscleRecoveryScore` | `muscle_recovery_score` | integer 0-100 | 73 / null |

Canonical seven-day seed arrays, oldest to newest:

```json
{
  "sleepHours": [7.33, 7.08, 6.92, 6.67, 6.53, 6.33, 6.3],
  "hrvMs": [49, 48, 47, 45, 44, 43, 42],
  "restingHeartRateBpm": [68, 69, 70, 70, 71, 72, 72],
  "stressScore": [4, 5, 5, 6, 6, 7, 7],
  "reactionTimeMs": [291, 294, 298, 301, 305, 309, 312]
}
```

`sleepHours` is presentation/trend input only; persistence/API canonical duration remains integer `sleepMinutes` to avoid floating-point equality drift.

## 4. Domain Identifiers

| Concept | API/frontend key | Database | Type |
|---|---|---|---|
| Plan ID | `planId` | `plan_id` | UUID |
| Plan action ID | `planActionId` | `plan_action_id` | UUID |
| Session ID | `sessionId` | `id` | UUID, client-generated allowed |
| Insight ID | `insightId` | `id` | UUID; deterministic demo string allowed locally |
| Assessment ID | `assessmentId` | `id` | UUID |
| Record ID | `recordId` | `id` | UUID |
| Idempotency key | `idempotencyKey` | `idempotency_key` | UUID |
| Request ID | `requestId` | log/transport only | UUID |
| Rule IDs | `ruleIds` | `rule_ids` | non-empty string array |
| Protocol version | `protocolVersion` | `protocol_version` | version string |

## 5. Enums

### `RuntimeMode`

- `demo`
- `authenticated`

### `WellnessStatus`

- `good`
- `attention`
- `no_data`
- `completed` — action-completion presentation only

### `SystemKey`

- `brain`
- `heart_autonomic`
- `lungs_breathing`
- `gut_nutrition`
- `muscle_recovery`
- `metabolic_labs`

### `ModelLayerKey`

- `skin`
- `brain`
- `eyes`
- `lungs`
- `heart`
- `gut`

Mapping: `brain -> brain`; `heart_autonomic -> heart`; `lungs_breathing -> lungs`; `gut_nutrition -> gut`; muscle/metabolic use `region_overlay`, not a `ModelLayerKey`. `eyes` and `skin` are renderer layers, not product systems.

### `SelectionKind`

- `verified_mesh`
- `region_overlay`
- `static_fallback`

### `ActionType`

- `brain_training`
- `breathing`
- `sleep_goal`
- `routine` *(additive; introduced by Task 10 / ADR-002)*

Canonical plan order for the original three values is unchanged and equals the enum order above, priorities 1-3. The `routine` value is the fourth additive value for AI-advice-recommended habits (e.g. consistent wake time); it does not appear in the P0 demo Plan order. Existing clients that do not enumerate the length keep working.

### `RoutineKey`

Allowlisted routine identifiers emitted by `AdviceProvider` and accepted by `AdviceItem.routineKey`. Adding a value requires an entry in `docs/knowledge/approved/`.

- `consistent_wake_time`
- `wind_down_30_min_no_screens`
- `no_caffeine_after_2pm`
- `morning_daylight_10_min`
- `regular_meal_times`
- `hydration_balance`
- `bedroom_dark_cool_quiet`
- `short_walk_after_dinner`

### `DetailAction`

- `start_brain_training`
- `view_brain_insight`
- `view_heart_insight`
- `start_breathing`
- `view_gut_assessment`
- `view_recovery`
- `view_records`

Detail actions are navigation/use-case intents. They are not persisted plan action types; application services map eligible intents to an `ActionType`.

### `ActionState`

- `pending`
- `active`
- `completed`

Valid transitions: `pending -> active -> completed`; `active -> pending` only after an abandoned/restarted session. `sleep_goal` may transition `pending -> completed` on explicit confirmation.

### `SessionType`

- `brain_training`
- `breathing`

### `SessionState`

- `active`
- `paused`
- `completed`
- `abandoned`

Valid transitions: `active <-> paused`; `active|paused -> completed|abandoned`. Terminal states do not reopen.

### `BreathingPhase`

- `inhale` — 4 seconds
- `hold` — 2 seconds
- `exhale` — 6 seconds

### `BreathingFeedback`

- `better`
- `same`
- `worse`

### `DataSourceType`

- `demo`
- `wearable`
- `assessment`
- `questionnaire`
- `user_entry`
- `record`
- `derived`

### `SourceConnectionStatus`

- `connected`
- `demo`
- `simulated`
- `not_connected`

Never label a source `connected` unless a live verified connection exists.

### `InsightGenerator`

- `deterministic_rule`
- `ai_refined`

### `AnalyticsMode`

- `disabled`
- `local`
- `consented_provider`

### `SafetyLevel` *(Task 10)*

- `green`
- `amber`
- `red`

The deterministic safety router is the source of truth; the model may not downgrade. `red` surfaces `escalationCopy`; `amber` surfaces `wellnessScope`; `green` is the ordinary wellness path.

### `SafetyReasonCode` *(Task 10)*

- `crisis_self_harm`
- `crisis_medical_emergency`
- `diagnosis_request`
- `medication_change_request`
- `sustained_decline_self_report`
- `conflicting_metric_signals`
- `minor_low_risk_wellness`
- `no_signals`

### `VoiceSessionState` *(Task 10)*

- `requested`
- `opening`
- `recording`
- `transcribing`
- `awaiting_confirmation`
- `confirmed`
- `analyzing`
- `awaiting_advice`
- `speaking`
- `completed`
- `abandoned`
- `failed`

### `ProviderMode` *(Task 10)*

- `mock`
- `live`

### `SttProviderKey` *(Task 10)*

- `mock`
- `google_stt_v2`
- `gemini_live`

### `AdviceProviderKey` *(Task 10)*

- `mock`
- `minimax`

### `TtsProviderKey` *(Task 10)*

- `mock`
- `minimax_tts`

### `VoiceLanguage` *(Task 10)*

- `en-US` *(MVP primary)*
- `en-GB`
- `zh-HK` *(disabled in MVP)*
- `yue-Hant-HK` *(disabled in MVP; reserved for粤语 path)*

### `VoiceAudioRetentionPolicy` *(Task 10)*

- `none` *(default)*
- `enabled_storage` *(requires consent + privacy review)*
- `research_grant` *(requires explicit research consent + retention policy)*

### `BrainDomain` *(Task 10)*

- `attention`
- `regulation`
- `memory`
- `sleep_arousal`

### `BrainScoreMode` *(Task 10)*

- `demo`
- `self_report`
- `cognitive_task`
- `qEEG`
- `HEG`

### `BrainScoreQuality` *(Task 10)*

- `acceptable`
- `marginal`
- `poor`
- `unverified`

### `EvidenceLevel` *(Task 10; knowledge base)*

- `expert_consensus`
- `peer_reviewed`
- `regulatory_body`
- `industry_guideline`
- `manufacturer_material`
- `demo_only`

### `KnowledgeStatus` *(Task 10; knowledge base)*

- `draft`
- `pending_review`
- `approved`
- `superseded`
- `withdrawn`
- `expired`

### `EscalationChannel` *(Task 10)*

- `local_emergency_number`
- `regional_hotline`
- `crisis_text_line`
- `trusted_person`

## 6. Deterministic Rule Keys

| Rule ID | Inputs | Output condition |
|---|---|---|
| `sleep_hrv_attention_v1` | current/baseline sleep minutes and HRV | both decreases are strictly greater than 10%; status `attention` |
| `stress_hrv_regulation_v1` | stress, current/baseline HRV | stress >= 7 and HRV below baseline; recommend regulation action |
| `sleep_reaction_context_v1` | current/baseline reaction time and sleep | reaction time >5% slower and sleep below baseline; cautious relationship copy |

Percentage change formula: `((current - baseline) / baseline) * 100`. Duration decrease and HRV decrease are presented as positive magnitudes after comparison. Zero/null baseline produces `no_data`.

Comparison window key: `current_day_vs_baseline`.

## 7. Analytics Events and Payload Allowlist

Every event payload may contain only: `eventVersion`, `occurredAt`, `runtimeMode`, `sourceScreen`, and the event-specific allowlisted keys below. It must not include metric values, age, free text, tokens, record contents, or external identifiers.

| Event | Additional allowed keys |
|---|---|
| `onboarding_started` | `entryPoint` |
| `onboarding_completed` | `skippedAssessment`, `skippedWearable` |
| `home_viewed` | none |
| `explore_viewed` | `renderMode` (`three_d`/`static_fallback`) |
| `system_selected` | `systemKey`, `selectionKind` |
| `insight_viewed` | `insightId`, `generatedBy` |
| `plan_viewed` | `completedActionCount`, `totalActionCount` |
| `brain_training_started` | `sessionId`, `protocolVersion` |
| `brain_training_completed` | `sessionId`, `protocolVersion` |
| `breathing_started` | `sessionId`, `protocolVersion` |
| `breathing_completed` | `sessionId`, `protocolVersion`, `feedbackProvided` |
| `assessment_started` | `assessmentKey`, `protocolVersion` |
| `assessment_completed` | `assessmentKey`, `protocolVersion` |
| `consultation_clicked` | `entryPoint`, `isSimulated` |
| `day_1_return` | none |
| `day_7_return` | none |
| `weekly_active_user` | none |
| `voice_checkin_started` *(Task 10)* | `language`, `sttProviderKey`, `providerMode` |
| `voice_checkin_completed` *(Task 10)* | `language`, `sttProviderKey`, `providerMode`, `confirmedSegmentCount`, `flaggedSegmentCount` |
| `voice_checkin_abandoned` *(Task 10)* | `language`, `sttProviderKey`, `providerMode`, `abandonReason` |
| `advice_run_completed` *(Task 10)* | `providerMode`, `safetyLevel`, `adviceItemCount`, `escalationShown` |
| `advice_item_accepted` *(Task 10)* | `actionType`, `sourceInsightId` |
| `escalation_shown` *(Task 10)* | `safetyLevel`, `copyId` |

`sourceScreen`: `home`, `explore`, `insights`, `plan`, `profile`, `brain_training_session`, or `breathing_session`.

## 8. Error Codes

Canonical cross-layer error codes:

- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `INVALID_STATE_TRANSITION`
- `IDEMPOTENCY_CONFLICT`
- `PLAN_CAPACITY_REACHED`
- `DEPENDENCY_UNAVAILABLE`
- `TIMEOUT`
- `MODEL_LOAD_FAILED`
- `WEBGL_UNAVAILABLE`
- `LOCAL_STATE_INVALID`
- `INTERNAL_ERROR`

UI error messages are mapped from codes; raw exceptions are never shown.

## 9. Storage Keys

| Key | Scope | Sensitive | Contract |
|---|---|---:|---|
| `sleepos.demo.v1` | browser localStorage | Synthetic wellness demo state | Versioned, runtime-validated, resettable; max 50 sessions/30 daily snapshots |
| `sleepos.onboarding.v1` | browser localStorage | Synthetic Alex onboarding draft | Versioned, runtime-validated, resettable; never uploaded or merged into a real account |
| `sleepos.demo.quarantine.v1` | browser sessionStorage | Invalid synthetic snapshot diagnostic | Optional; contains reason code only, not raw invalid payload |
| `sleepos.motionPreference.v1` | browser localStorage | No | `system`, `reduced`, or `full`; system setting remains authoritative by default |

No auth token, provider credential, real health record, or AI prompt may be stored under these keys.

## 10. Environment Variables

| Key | P0 required | Scope | Secret | Description |
|---|---:|---|---:|---|
| `NEXT_PUBLIC_SLEEPOS_RUNTIME_MODE` | No | client/build | No | Defaults to `demo`; only allow `demo` in P0 |
| `NEXT_PUBLIC_BODY_MODEL_VERSION` | When 3D enabled | client/build | No | Approved asset version identifier |
| `NEXT_PUBLIC_BODY_MODEL_URL` | When 3D enabled | client/build | No | Controlled body GLB URL/path |
| `NEXT_PUBLIC_SKIN_MODEL_URL` | When 3D enabled | client/build | No | Controlled v6 skin GLB URL/path |
| `DATABASE_URL` | No | server | Yes | Optional Phase 4 pooled Postgres connection |
| `DIRECT_URL` | No | migration/admin | Yes | Optional Phase 4 direct migration connection |
| `SUPABASE_URL` | No | server | No | Optional Phase 4 project URL |
| `SUPABASE_ANON_KEY` | No | client/server | Publishable | Only if reviewed client auth/data path needs it |
| `SUPABASE_SERVICE_ROLE_KEY` | No | server only | Yes | Never exposed to browser or logs |
| `AI_PROVIDER_API_KEY` | No | server only | Yes | Optional P1 wording refinement |
| `ANALYTICS_PROVIDER_KEY` | No | client/server per provider | Depends | Optional after provider/consent decision |
| `SLEEPOS_PROVIDER_MODE` *(Task 10)* | No | server/build | No | `mock` \| `live`; demo runs end-to-end without external keys |
| `SLEEPOS_STT_PROVIDER` *(Task 10)* | No | server/build | No | `mock` \| `google_stt_v2` \| `gemini_live` |
| `SLEEPOS_ADVICE_PROVIDER` *(Task 10)* | No | server/build | No | `mock` \| `minimax` |
| `SLEEPOS_TTS_PROVIDER` *(Task 10)* | No | server/build | No | `mock` \| `minimax_tts` |
| `SLEEPOS_STT_DEFAULT_LANGUAGE` *(Task 10)* | No | server/build | No | `en-US` (default) \| `en-GB` |
| `SLEEPOS_VOICE_AUDIO_RETENTION` *(Task 10)* | No | server/build | No | `none` (default) \| `enabled_storage` \| `research_grant`; never persist raw audio without explicit consent |
| `GOOGLE_APPLICATION_CREDENTIALS` *(Task 10)* | When `SLEEPOS_STT_PROVIDER=google_stt_v2` | server only | Yes | Standard Google service-account path |
| `SLEEPOS_GOOGLE_STT_PROJECT_ID` *(Task 10)* | When `SLEEPOS_STT_PROVIDER=google_stt_v2` | server only | Yes | Google Cloud project for STT billing/quota |
| `MINIMAX_API_KEY` *(Task 10)* | When `SLEEPOS_ADVICE_PROVIDER=minimax` or `SLEEPOS_TTS_PROVIDER=minimax_tts` | server only | Yes | MiniMax provider secret; never exposed to the browser bundle |
| `MINIMAX_API_BASE_URL` *(Task 10)* | No | server only | No | Override for staging / regional endpoints |
| `MINIMAX_TEXT_MODEL` *(Task 10)* | No | server only | No | Provider model name; controlled by env, not domain code |
| `MINIMAX_TTS_MODEL` *(Task 10)* | No | server only | No | TTS provider model name |
| `MINIMAX_TTS_VOICE` *(Task 10)* | No | server only | No | Voice identifier; no clone-voice usage without written consent |
| `SLEEPOS_KNOWLEDGE_BUNDLE_PATH` *(Task 10)* | No | server only | No | Path to the approved knowledge bundle (JSONL) |
| `SLEEPOS_EVAL_SUITE_PATH` *(Task 10)* | No | server only | No | Path to the safety evaluation suite JSONL |

P0 must start without database, Supabase, AI, or analytics provider variables. Public body-model URLs are not secrets, but asset provenance and controlled hosting remain release requirements.

The frontend bundle MUST NOT contain any `NEXT_PUBLIC_MINIMAX_*` or `NEXT_PUBLIC_GOOGLE_*` secret-shaped variable. CI blocks such names.

## 11. Safety Copy Keys

| Identifier | Where shown | Status |
|---|---|---|
| `wellnessDisclaimer` | All footers and adjacent to AI advice text | `approved` |
| `wellnessScope` *(Task 10)* | Voice check-in landing; Insight header for amber routing | `pending` |
| `escalationCopy` *(Task 10)* | Red safety routing surface; never in footer | `pending` |

Canonical English text:

- `wellnessDisclaimer`:
  > SleepOS provides wellness information and does not replace professional medical advice or diagnosis.
- `wellnessScope` *(pending; authoritative source `shared/constants/safety.ts`)*:
  > SleepOS helps you understand your sleep, train your brain, and choose low-risk wellness actions. It is not a diagnostic tool and does not replace professional care.
- `escalationCopy` *(pending; placeholder `[REGIONAL_HOTLINE]` must be filled in by Legal / Clinical for each release region)*:
  > This sounds urgent. Please contact a local emergency service or a trusted person right now. SleepOS does not provide emergency support. If you are in [REGION], you can call [REGIONAL_HOTLINE].

Copy changes require product/safety review; tests select the identifier rather than duplicate the sentence across features. Region-specific escalation numbers must be reviewed by Legal / Clinical before any release that targets that region.

Independent review of new copy identifiers (`wellnessScope`, `escalationCopy`) is pending external review.
