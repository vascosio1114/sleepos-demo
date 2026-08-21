# SleepOS MVP API Contract

## 1. Scope and Transport

This document defines the stable service contract used by the UI and domain layer.

- P0 uses an in-process `LocalDemoRepository`; it must implement the same operations and response models without HTTP.
- `/api/v1` is the reserved HTTP representation for optional authenticated persistence in Phase 4.
- JSON uses UTF-8, camelCase keys, ISO 8601 UTC timestamps, `YYYY-MM-DD` local date keys, and UUIDs unless a documented demo identifier is used.
- Clients must ignore unknown response fields but must not send unknown request fields.
- Breaking changes require a new API version; fields are never silently renamed or repurposed.

## 2. Common Contracts

### Success envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "f5107a16-bfa8-4f12-92be-00bdc212aa5e",
    "apiVersion": "v1"
  }
}
```

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check the highlighted fields and try again.",
    "fieldErrors": [{ "field": "feedback", "code": "INVALID_ENUM" }],
    "retryable": false
  },
  "meta": {
    "requestId": "f5107a16-bfa8-4f12-92be-00bdc212aa5e",
    "apiVersion": "v1"
  }
}
```

Messages are safe for users and never expose stack traces, SQL, provider responses, filesystem paths, or secrets. `fieldErrors` is optional.

### Authentication modes

| Mode | Contract |
|---|---|
| `demo` (P0) | No HTTP auth; identity is fixed to synthetic `demo_001`; cannot access real data |
| `authenticated` (later) | Server derives user identity from a verified session; request bodies never authorize through `userId` |

### Idempotency

All mutation requests require `Idempotency-Key: <UUID>` in HTTP mode and an equivalent `idempotencyKey` argument in local mode. Keys are scoped to authenticated/demo subject plus operation. Repeating the same key and equivalent request returns the original success; reuse with a different payload returns `IDEMPOTENCY_CONFLICT`.

### Standard errors

| Code | HTTP | Meaning | Retryable |
|---|---:|---|---|
| `VALIDATION_ERROR` | 400 | Request failed runtime validation | No |
| `UNAUTHENTICATED` | 401 | No valid real-user session | No |
| `FORBIDDEN` | 403 | Subject cannot access resource | No |
| `NOT_FOUND` | 404 | Resource absent or not visible to subject | No |
| `INVALID_STATE_TRANSITION` | 409 | Requested transition is not allowed | No |
| `IDEMPOTENCY_CONFLICT` | 409 | Key was reused with a different payload | No |
| `PLAN_CAPACITY_REACHED` | 409 | Plan already has three different actions | No |
| `DEPENDENCY_UNAVAILABLE` | 503 | Required persistence dependency failed | Yes |
| `TIMEOUT` | 504 | Bounded dependency operation timed out | Yes |
| `INTERNAL_ERROR` | 500 | Unexpected safe server failure | Maybe; follow response |

## 3. Canonical Read Models

The examples are illustrative and not complete schema substitutes. Canonical keys/enums are in `SHARED_KEYS.md`.

```ts
type DailyMetrics = {
  localDate: string;
  sleepMinutes: number | null;
  sleepQualityScore: number | null;
  hrvMs: number | null;
  restingHeartRateBpm: number | null;
  spo2Percent: number | null;
  respiratoryRatePerMin: number | null;
  stressScore: number | null;
  attentionScore: number | null;
  memoryScore: number | null;
  reactionTimeMs: number | null;
  muscleRecoveryScore: number | null;
  sourceType: DataSourceType;
  measuredAt: string;
};

type PlanAction = {
  id: string;
  actionType: ActionType;
  title: string;
  priority: 1 | 2 | 3;
  state: ActionState;
  targetTimeLocal: string | null;
  completedAt: string | null;
};
```

## 4. Bootstrap

### `GET /api/v1/bootstrap?localDate=YYYY-MM-DD`

**Purpose:** Return one internally consistent initial read model for all five primary destinations.

**Auth:** Demo locally; authenticated session in real mode.  
**Permission:** Current subject only.

#### Success `200`

```json
{
  "data": {
    "mode": "demo",
    "profile": { "id": "demo_001", "displayName": "Alex", "ageYears": 35 },
    "home": {
      "status": "attention",
      "statusText": "Recovery may need attention",
      "primaryMetricKeys": ["sleepMinutes", "hrvMs", "reactionTimeMs"],
      "recommendedActionType": "brain_training",
      "completedActionCount": 0,
      "totalActionCount": 3
    },
    "dailyMetrics": {},
    "sevenDayTrends": {},
    "systems": [],
    "currentInsight": {},
    "todayPlan": {},
    "connectedSources": []
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

`localDate` is required and interpreted in the profile timezone. No pagination. Safe for retry. The response never claims freshness beyond each metric's provenance timestamp.

## 5. System Detail

### `GET /api/v1/systems/{systemKey}?localDate=YYYY-MM-DD`

**Purpose:** Return the same detail model for 3D, static fallback, and deep-link selection.

**Auth/permission:** Same as Bootstrap.

#### Success `200`

```json
{
  "data": {
    "systemKey": "brain",
    "displayName": "Brain",
    "status": "attention",
    "selectionKind": "verified_mesh",
    "metricKeys": ["attentionScore", "reactionTimeMs", "stressRegulationScore"],
    "actions": ["start_brain_training", "view_brain_insight"]
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Invalid keys return `VALIDATION_ERROR`; missing configured systems return `NOT_FOUND`.

## 6. Current Insight

### `GET /api/v1/insights/current?localDate=YYYY-MM-DD`

**Purpose:** Return the top deterministic insight and provenance.

#### Success `200`

```json
{
  "data": {
    "id": "insight_demo_2026-08-11_recovery",
    "status": "attention",
    "headline": "Shorter sleep happened alongside lower recovery signals",
    "whatChanged": "Sleep was 12% shorter than baseline.",
    "whatHappenedAlongside": "HRV was 13% below baseline and reaction time was slower.",
    "possibleRelationship": "These changes may be related to reduced recovery.",
    "nextAction": "Try today's short regulation and attention session.",
    "actionType": "brain_training",
    "ruleIds": ["sleep_hrv_attention_v1", "sleep_reaction_context_v1"],
    "comparisonWindow": "current_day_vs_baseline",
    "evidenceMetricKeys": ["sleepMinutes", "hrvMs", "reactionTimeMs"],
    "generatedBy": "deterministic_rule",
    "generatedAt": "2026-08-11T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

When required inputs are missing/stale, return a qualified `no_data` insight, not invented evidence. Optional AI may only change the four display strings and must report `generatedBy: "ai_refined"`; rules, evidence, status, and action remain deterministic.

## 7. Today's Plan

### `GET /api/v1/plans/today?localDate=YYYY-MM-DD`

Returns one plan with 1-3 actions, unique action types, contiguous priorities, and derived completion counts.

### `POST /api/v1/plans/today/actions`

**Purpose:** Add a deterministic insight recommendation once.

#### Request

```json
{
  "localDate": "2026-08-11",
  "insightId": "insight_demo_2026-08-11_recovery",
  "actionType": "brain_training"
}
```

#### Success `200` or `201`

```json
{
  "data": {
    "action": { "id": "uuid", "actionType": "brain_training", "priority": 1, "state": "pending" },
    "wasCreated": false,
    "completedActionCount": 0,
    "totalActionCount": 3
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Return `201` only for first creation and `200` for an idempotent/existing logical action. The server resolves title and priority; client copy is not accepted.

### `PUT /api/v1/plans/today/sleep-goal`

#### Request

```json
{ "localDate": "2026-08-11", "targetTimeLocal": "22:30", "isConfirmed": true }
```

Upserts the unique `sleep_goal` action. `targetTimeLocal` is 24-hour `HH:mm`. P0 reminders remain `simulated`.

## 8. Intervention Sessions

### `POST /api/v1/sessions`

**Purpose:** Start one session and activate its plan action.

#### Request

```json
{
  "sessionId": "3e195a2b-7334-49c7-a713-20454ed9e01c",
  "localDate": "2026-08-11",
  "sessionType": "brain_training",
  "planActionId": "a7ef69b8-1034-4a14-89a3-ab5ea313166c",
  "startedAt": "2026-08-11T12:00:00.000Z"
}
```

#### Success `201`

```json
{
  "data": { "sessionId": "3e195a2b-7334-49c7-a713-20454ed9e01c", "state": "active" },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Allowed plan transition: `pending -> active`. A same-key retry returns the same session.

### `POST /api/v1/sessions/{sessionId}/complete`

**Purpose:** Atomically save aggregate results and complete the related action.

#### Brain-training request

```json
{
  "sessionType": "brain_training",
  "completedAt": "2026-08-11T12:03:00.000Z",
  "durationSeconds": 180,
  "brainTrainingResult": {
    "reactionTimeMs": 304,
    "accuracyPercent": 92,
    "missedResponses": 2,
    "completedTrials": 24,
    "baselineReactionTimeMs": 291
  }
}
```

#### Breathing request

```json
{
  "sessionType": "breathing",
  "completedAt": "2026-08-11T12:05:00.000Z",
  "durationSeconds": 180,
  "breathingResult": {
    "completedCycles": 15,
    "feedback": "better"
  }
}
```

Exactly one result object must match `sessionType`.

#### Success `200`

```json
{
  "data": {
    "session": { "id": "uuid", "state": "completed", "completedAt": "2026-08-11T12:03:00.000Z" },
    "plan": { "completedActionCount": 1, "totalActionCount": 3 },
    "wasAlreadyCompleted": false
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Completion is atomic. A duplicate equivalent request returns `wasAlreadyCompleted: true`; a conflicting result returns `IDEMPOTENCY_CONFLICT` or `INVALID_STATE_TRANSITION`.

### `POST /api/v1/sessions/{sessionId}/abandon`

#### Request

```json
{ "abandonedAt": "2026-08-11T12:01:00.000Z", "reason": "user_exit" }
```

Allowed from `active` or `paused`. The related action returns to `pending` for a restart and progress does not increase.

## 9. Demo State Control

### Local operation `resetDemoState()`

P0 exposes this through the local repository/UI, not a network endpoint. It deletes only `sleepos.demo.v1`, reloads the canonical Alex seed, and returns Bootstrap data. A production/pilot API must not expose a public equivalent.

## 10. Operational Rules

- Mutation body limit: 32 KiB for documented MVP JSON endpoints.
- Default server timeout: 10 seconds; optional AI timeout must be shorter than the enclosing request budget.
- No endpoint accepts files in P0.
- API logs include request ID, route template, outcome code, latency, and safe subject hash only.
- Rate limits are mandatory before real auth/AI/session-write rollout; exact limits are environment configuration, not client contract.
- Caching: Bootstrap, current insight, and today's plan are private/no-store when authenticated. Static system catalog may be version-cached.
- There is no list endpoint requiring pagination in P0. Any future session history endpoint must use cursor pagination with a maximum page size of 50.

Independent review remains pending; this contract is authored, not approved.

---

## 11. Voice Check-in, AI Advice, and Brain Score (Task 10 — Additive Stream)

These endpoints implement `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` §3–§9 on top of the P0 contract above. All routes require `Idempotency-Key` (UUID), runtime schema validation, ownership check, provider timeout, and bounded retry. Every write endpoint returns the standard success/error envelope from §2.

### 11.1 Voice Sessions

#### `POST /api/v1/voice/sessions`

**Purpose:** Open a new voice check-in session and return configuration for the client (language, STT provider, audio limits, retention policy).

**Auth:** Demo locally; authenticated session in real mode.  
**Permission:** Current subject only.

Request:

```json
{
  "language": "en-US",
  "audioRetention": "none",
  "clientCapabilities": { "sampleRateHz": 16000, "encoding": "pcm_s16le" }
}
```

Success `201`:

```json
{
  "data": {
    "sessionId": "uuid",
    "sttProviderKey": "google_stt_v2",
    "providerMode": "live",
    "language": "en-US",
    "maxSessionSeconds": 180,
    "maxChunkBytes": 262144,
    "lowConfidenceThreshold": 0.78,
    "startedAt": "2026-08-19T08:00:00.000Z"
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Errors: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `DEPENDENCY_UNAVAILABLE`, `TIMEOUT`.

#### `WS /api/v1/voice/sessions/{sessionId}/stream`

**Purpose:** Bidirectional WebSocket for streaming PCM chunks and receiving partial transcript segments.

- Client → server: `{type: "audio", sequence: number, pcmBytes: base64, capturedAt: ISO}`.
- Server → client: `{type: "transcript_segment", segmentId, text, language, confidence, startedAtMs, endedAtMs, isConfirmed: false}` or `{type: "error", code, retryable}`.
- Server enforces `maxChunkBytes` and `maxSessionSeconds`; closes with code `4001` (size), `4002` (duration), `4003` (provider unavailable).
- The server NEVER persists any audio bytes when `audioRetention = none` (the default).

#### `POST /api/v1/voice/sessions/{sessionId}/finish`

**Purpose:** Finalize the session, mark `state = 'completed'`, and return the full transcript for client confirmation.

Request:

```json
{ "finishedAt": "2026-08-19T08:03:00.000Z" }
```

Success `200`:

```json
{
  "data": {
    "sessionId": "uuid",
    "state": "awaiting_confirmation",
    "language": "en-US",
    "segments": [
      { "segmentId": "uuid", "text": "I slept about six and a half hours.", "language": "en-US", "confidence": 0.91, "startedAtMs": 1200, "endedAtMs": 3400, "isConfirmed": false }
    ],
    "flaggedSegmentIds": ["uuid"]
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

#### `PUT /api/v1/voice/sessions/{sessionId}/transcript`

**Purpose:** Persist the user-confirmed transcript (or edits). Only confirmed text is stored; the server rejects any segment with `isConfirmed = false`.

Request:

```json
{
  "sessionId": "uuid",
  "segments": [
    {
      "segmentId": "uuid",
      "text": "I slept about six and a half hours.",
      "language": "en-US",
      "confidence": 0.91,
      "startedAtMs": 1200,
      "endedAtMs": 3400,
      "isConfirmed": true,
      "userEdited": false
    }
  ]
}
```

Success `200`:

```json
{
  "data": {
    "sessionId": "uuid",
    "state": "confirmed",
    "confirmedSegmentCount": 1,
    "flaggedSegmentCount": 0
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Errors: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `INVALID_STATE_TRANSITION` (already confirmed / abandoned / failed).

### 11.2 Health Check-ins

#### `POST /api/v1/checkins`

**Purpose:** Persist the confirmed five-field self-report and optional note.

Request:

```json
{
  "localDate": "2026-08-19",
  "schemaVersion": "health-checkin-v1",
  "capturedAt": "2026-08-19T08:05:00.000Z",
  "source": "voice_confirmed",
  "sleepQualityScore": 45,
  "sleepMinutes": 390,
  "stressScore": 7,
  "moodScore": 5,
  "focusScore": 58,
  "confirmedNote": "Felt tired after a long week.",
  "sourceSegmentIds": ["uuid"]
}
```

Success `201`:

```json
{
  "data": { "checkinId": "uuid", "localDate": "2026-08-19" },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

Errors: `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT` (same key, different payload).

#### `GET /api/v1/checkins/{checkinId}`

**Purpose:** Return one check-in by ID.

Success `200`:

```json
{
  "data": {
    "checkinId": "uuid",
    "userId": "demo_001",
    "localDate": "2026-08-19",
    "schemaVersion": "health-checkin-v1",
    "capturedAt": "2026-08-19T08:05:00.000Z",
    "source": "voice_confirmed",
    "sleepQualityScore": 45,
    "sleepMinutes": 390,
    "stressScore": 7,
    "moodScore": 5,
    "focusScore": 58,
    "confirmedNote": "Felt tired after a long week.",
    "sourceSegmentIds": ["uuid"]
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

### 11.3 Advice Runs

#### `POST /api/v1/advice-runs`

**Purpose:** Trigger an advice run. The server orchestrates: safety routing → deterministic observations → knowledge retrieval → AI advice generation → schema validation → output storage.

Request:

```json
{
  "localDate": "2026-08-19",
  "checkinId": "uuid",
  "sessionId": "uuid"
}
```

Success `200` (or `201` on first creation):

```json
{
  "data": {
    "adviceRunId": "uuid",
    "status": "succeeded",
    "safetyLevel": "green",
    "safetyReasonCodes": ["minor_low_risk_wellness"],
    "summary": "Your sleep was a little shorter than usual.",
    "observations": [
      { "statement": "Sleep was about 12% shorter than baseline.", "evidenceMetricKeys": ["sleepMinutes"], "uncertainty": "Based on your usual pattern." }
    ],
    "adviceItems": [
      { "title": "Try a wind-down routine", "reason": "Consistent pre-sleep habits support recovery.", "actionType": "routine", "routineKey": "wind_down_30_min_no_screens", "durationMinutes": 30, "riskLevel": "low" }
    ],
    "brainDomains": [],
    "sourceIds": ["sleep-hygiene-fundamentals-en-v1"],
    "followUpQuestion": null,
    "escalation": null,
    "speakableText": "Try a wind-down routine without screens for thirty minutes before bed tonight.",
    "provenance": {
      "promptVersion": "advice-prompt-v1",
      "knowledgeVersion": "kb-en-2026-08-19",
      "safetyReasonCodes": ["minor_low_risk_wellness"],
      "adviceProviderKey": "minimax"
    }
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

If the model output fails schema validation, the server returns `status: "failed_safe_fallback"` and `adviceItems: []`; the client must surface the deterministic safe fallback rather than the model output.

Errors: `VALIDATION_ERROR`, `NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`, `TIMEOUT`, `INTERNAL_ERROR`.

#### `GET /api/v1/advice-runs/{adviceRunId}`

**Purpose:** Read a stored advice run.

Success `200`: same envelope as the create response.

#### `POST /api/v1/advice-runs/{adviceRunId}/speech`

**Purpose:** Synthesise `speakableText` to audio and stream it back. The server does NOT persist the audio when `audioRetention = none` (the default); the response is a one-shot payload.

Request:
```json
{ "rate": 1.0 }
```

Success `200`:

- `Content-Type: audio/pcm` or per-adapter MIME.
- Response headers include `X-SleepOS-Audio-Duration-Ms`, `X-SleepOS-Tts-Provider-Key`.
- No `Cache-Control: public`; default `no-store`.

Errors: `DEPENDENCY_UNAVAILABLE`, `TIMEOUT`. When TTS fails, the client uses the existing `speakableText` and surfaces a "speech unavailable" hint without losing the advice content.

### 11.4 Brain Scores

#### `GET /api/v1/brain-scores/current`

**Purpose:** Return the latest `brain_score_snapshot` for the current user.

Success `200`:

```json
{
  "data": {
    "snapshotId": "uuid",
    "userId": "demo_001",
    "capturedAt": "2026-08-18T22:00:00.000Z",
    "protocolVersion": "brain-domain-v1",
    "mode": "self_report",
    "assessorId": null,
    "domains": [
      { "key": "attention", "score": 78, "status": "good", "measured": true, "sourceMetricKeys": ["reactionTimeMs", "accuracyPercent"], "quality": "acceptable" },
      { "key": "regulation", "score": 64, "status": "attention", "measured": true, "sourceMetricKeys": ["stressScore", "hrvMs"], "quality": "acceptable" },
      { "key": "memory", "score": 82, "status": "good", "measured": true, "sourceMetricKeys": ["memoryScore"], "quality": "acceptable" },
      { "key": "sleep_arousal", "score": null, "status": "no_data", "measured": false, "sourceMetricKeys": [], "quality": "unverified" }
    ],
    "regionalScores": [],
    "fiveDScores": [],
    "disclaimerKey": "wellness_not_diagnosis"
  },
  "meta": { "requestId": "uuid", "apiVersion": "v1" }
}
```

`regionalScores` MUST be empty unless the row's `mode ∈ {qEEG, HEG}` and `assessor_id` is non-null. When the user has no snapshot, the response returns `404 NOT_FOUND` and the UI surfaces the `wellnessScope` copy.

#### `GET /api/v1/brain-scores/history?limit=30&before=YYYY-MM-DD`

**Purpose:** Return up to 30 historical snapshots, oldest-to-newest unless `desc=true`. Cursor pagination; max page size 50.

### 11.5 Knowledge (admin / internal — not user-facing)

The `knowledge_documents` and `knowledge_chunks` tables are not exposed via public endpoints in MVP. Authoring is a server-side admin operation behind a separate auth context. The retrieval layer reads approved rows only.

### 11.6 Common Errors for §11

In addition to §2 errors, §11 endpoints may return:

| Code | HTTP | When |
|---|---:|---|
| `AUDIO_RETENTION_FORBIDDEN` | 403 | Client requested `audioRetention=enabled_storage` without consent ledger entry |
| `PROVIDER_MODE_FORBIDDEN` | 403 | `SLEEPOS_PROVIDER_MODE=mock` but client requested live advice |
| `SAFETY_ESCALATION` | 422 | Red safety routing — server did NOT produce advice items; client must surface escalation copy |
| `SCHEMA_VALIDATION_FAILED` | 422 | Model output failed strict schema validation; `adviceItems` is empty in response |
| `LANGUAGE_NOT_ENABLED` | 400 | Requested `voiceLanguage` outside `ENABLED_VOICE_LANGUAGES` |

### 11.7 Operational Rules (additive to §10)

- WebSocket frame body limit: `MAX_AUDIO_CHUNK_BYTES` from `shared/constants/voice-languages.ts`.
- WebSocket idle close: server closes after 60 s of silence.
- Speech synthesis timeout: 4 s; on timeout, return `TIMEOUT` and let the client fall back to text.
- Advice run timeout: 8 s; on timeout, return `TIMEOUT` and surface the deterministic safe fallback.
- No endpoint accepts raw audio uploads in MVP; audio is stream-only over WebSocket.
- All §11 logs include `sessionId`, `providerMode`, `sttProviderKey`, `adviceProviderKey`, `safetyLevel` and a safe subject hash; never include raw transcript text, audio bytes, or prompt content.
