# SleepOS MVP Data Flow

## 1. Shared Processing Contract

Every use case follows this order:

```text
trigger -> parse -> runtime validate -> authorize when real identity exists
        -> execute domain rule/state transition -> repository commit
        -> derive read model -> emit allowlisted event -> render result
```

P0 uses `LocalDemoRepository`; the later HTTP/Supabase path implements the same repository/use-case contracts. Client validation improves usability but never substitutes for server validation when the API is enabled.

## 2. Bootstrap and Restore

**Trigger:** application starts or user chooses “Continue as Alex.”

1. Load immutable canonical seed for `demo_001`.
2. Read `sleepos.demo.v1` if local durability is enabled.
3. Validate snapshot version, identity, fields, enums, ranges, and state transitions.
4. Merge only accepted demo mutations over the canonical seed.
5. Derive Home summary, current insight, today's plan, source statuses, and system details.
6. Return one `BootstrapResponse` read model so all screens start from the same state.

No authentication is claimed. Corrupt/incompatible state is quarantined, seed state is returned, and a reset notice is shown. No analytics payload includes the metric values.

## 3. Home -> Explore -> Insight

**Trigger:** user opens a metric/system/insight action.

- Navigation carries only canonical context keys (`systemKey`, optional `metricKey`, and `sourceScreen`).
- The destination resolves content from the active repository; navigation parameters never contain trusted health data.
- Explore mounts the 3D adapter after the route shell is usable.
- Selecting an HTML control or verified mesh maps to one `SystemKey`, updates accessible selection state, and emits `system_selected`.
- The detail sheet reads the canonical system read model and exposes only mapped actions.
- Insights run deterministic rules against required daily snapshots and baselines, record rule identifiers and comparison windows, and return one prioritized insight.

If required metrics are missing or stale, the rule returns `no_data`/qualified copy. If 3D fails, the static selector produces the identical `SystemKey` flow.

## 4. Add Insight Recommendation to Plan

**Trigger:** user chooses “Add to Plan.”

1. Validate `insightId`, `actionType`, and today's local date key.
2. Resolve the current insight and plan from repository state; do not trust client-provided copy or priority.
3. Check the unique logical key `(planId, actionType)`.
4. If present, return the existing action with `wasCreated: false`.
5. If absent and the plan has fewer than three actions, insert at the domain-defined priority and return `wasCreated: true`.
6. If the plan already contains three different actions, return `PLAN_CAPACITY_REACHED` with no mutation.

The operation uses an idempotency key when transported over HTTP. The UI must not display duplicate success for retries.

## 5. Brain-Training Session

### Start

1. User launches Brain Training from Home, Explore, Insight, or Plan.
2. Create a client-generated UUID `sessionId` and idempotency key.
3. Validate action eligibility and transition the plan action `pending -> active`.
4. Store `startedAt`; render focused session UI.
5. Emit `brain_training_started` with non-sensitive context only.

### Run

- Stimulus timing uses a monotonic browser clock; persisted timestamps use UTC.
- Raw key/pointer events remain ephemeral.
- Derived result fields are duration, median reaction time, accuracy, missed responses, completed trials, and comparison with baseline.
- Inputs outside approved task ranges fail validation rather than being clipped into a successful result.

### Complete

1. Client submits `sessionId`, `idempotencyKey`, aggregate result, and `completedAt`.
2. Validate aggregate consistency and valid `active -> completed` transition.
3. Commit session and plan-action completion atomically in the active repository.
4. Recalculate plan progress and Home summary from the committed state.
5. Return the existing result if the same idempotency key is retried.
6. Emit `brain_training_completed` only on the first successful commit.

### Interrupt

An exit request prompts the user. Confirmed exit records `abandoned` or discards the unsaved local draft according to implementation policy; it never marks the plan action completed. A later restart uses a new session ID.

## 6. Breathing Session

**Trigger:** user starts Breathing.

- Domain timing is `inhale 4s -> hold 2s -> exhale 6s` repeated for the configured duration.
- State transitions are `pending -> active -> paused -> active -> completed`; `active|paused -> abandoned` is allowed.
- Completion accepts `better`, `same`, or `worse` feedback, or explicit `null` if skipped.
- The repository atomically commits the session, completion state, and daily progress.
- Retry uses the original idempotency key and returns the existing result.
- Visibility/background changes pause timing or require explicit resume; elapsed wall time must not create fictional completed cycles.

## 7. Sleep Goal

**Trigger:** user confirms an in-bed target.

1. Validate `HH:mm` local wall time and local date.
2. Upsert the existing `sleep_goal` plan action rather than create a duplicate.
3. Mark the action complete only after explicit user confirmation.
4. Any reminder shown in P0 is labelled Simulated and creates no operating-system or external notification.

## 8. Optional AI Wording Refinement (P1)

1. Deterministic engine produces the full safe insight and rule provenance first.
2. Server constructs a minimal structured request from allowlisted facts; no raw record, token, or unnecessary identifier is sent.
3. Provider call has a bounded timeout and no unbounded retry.
4. Output is parsed against `AiInsightOutput` and screened for prohibited diagnostic, causal, treatment, or medication claims.
5. Valid wording may replace display strings only; action type, evidence, status, and rule IDs remain deterministic.
6. Timeout, malformed output, policy failure, or provider error returns the original deterministic insight.

P0 makes no provider call.

## 9. Optional Authenticated Persistence (P1/Pilot)

1. User authenticates through the selected server-supported flow.
2. Server derives `userId` from the verified session, never from request JSON.
3. Runtime schemas validate the request.
4. Service executes ownership and idempotency checks.
5. Supabase transaction writes user-scoped rows; RLS supplies defense in depth.
6. API returns the canonical envelope with `requestId`.
7. Logs retain route, outcome, latency, request ID, and safe error code only.

Demo data and real accounts use separate namespaces/environments. Demo localStorage is never uploaded into a pilot account automatically.

## 10. Analytics Flow

- Producers call a typed analytics port with an event from `SHARED_KEYS.md`.
- The adapter strips non-allowlisted properties and honors the active consent/provider mode.
- P0 defaults to local console-disabled/no-op capture suitable for tests; no third-party provider is required.
- Delivery failure never blocks the user action and never converts failure into an application error.
- Completion events are emitted only after repository commit; view/start events may emit after the corresponding screen/state is observable.

## 11. Recovery and Atomicity Matrix

| Operation | Atomic unit | Retry | Rollback/recovery |
|---|---|---|---|
| Bootstrap | Validated snapshot read | Reload once | Reset to canonical demo seed |
| Add action | Plan uniqueness + capacity check | Same idempotency key | No mutation on conflict/capacity error |
| Start session | Session + action activation | Return same session | Restore pending only if start commit failed |
| Complete session | Session result + action + progress | Return prior success | All-or-nothing; never partial completion |
| Set sleep goal | One action upsert | Return current value | Preserve last valid target |
| AI refinement | Display wording only | At most one bounded retry if configured | Deterministic wording |
| Analytics | Independent side effect | Adapter policy, bounded | Drop safely; never roll back product action |
| 3D selection | Ephemeral UI selection | User retry | Static selector |

## 12. Data Minimization

- Persist aggregate training results, not raw interaction streams.
- Store record metadata only until a reviewed upload feature exists.
- Analytics never includes sleep/HRV/reaction values, birth date, free text, or record contents.
- Logs never include tokens, raw prompts with sensitive data, database statements containing user values, or localStorage contents.
- P0 seed data is synthetic and labelled Demo where it could be mistaken for live data.
