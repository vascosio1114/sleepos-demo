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
