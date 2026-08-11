# SleepOS MVP System Architecture

## 1. Decision Summary

SleepOS is a mobile-first Next.js/React application with a local-first competition-demo runtime.

- **P0 competition MVP:** runs from canonical synthetic Alex data with no account, network, database, AI provider, or Supabase dependency.
- **P1 pilot foundation:** may replace the local repository with authenticated API and Supabase persistence without changing UI/domain contracts.
- **3D runtime:** the supplied BodyParts3D implementation is isolated to the Explore route and loaded client-side.
- **Insight engine:** deterministic rules always produce the safe baseline explanation. Optional AI may only refine validated wording later.
- **Health boundary:** SleepOS is a wellness product. It does not diagnose, treat, or infer causality.

This is the Phase 0 architecture contract. Implementation may refine internal file placement, but it must not cross the boundaries below without updating this document and the canonical API/schema/key registries.

## 2. Runtime Topology

```text
Browser
  Next.js application shell
    UI routes and accessible controls
    Domain services and runtime validation
    LocalDemoRepository (P0 default)
      canonical Alex seed
      in-memory state
      versioned localStorage snapshot (optional browser durability)
    Explore3D client island
      supplied Three.js 0.160.0 / GSAP 3.12.5 behavior
      controlled GLB asset URLs

Optional later topology (P1/pilot)
  Browser -> HTTPS /api/v1 -> server services -> Supabase Postgres/Auth
                                      -> optional bounded AI wording provider
```

The P0 build must render and complete its critical journey after installation on localhost with outbound network disabled, except that remote prototype GLBs may be used during asset integration only. A checked-in or controlled-origin static fallback is required for the release gate.

## 3. Module Boundaries

| Layer | Owns | Must not own |
|---|---|---|
| Application shell | Routes, five-item navigation, responsive layout, global disclaimer | Health calculations, storage writes, Three.js internals |
| Feature UI | Home, Explore, Insights, Plan, Profile, focused session screens and UI state | Database queries, rule definitions, cross-feature mutation logic |
| Domain | Metric calculations, status derivation, plan/session transitions, insight rules, shared types | React rendering, browser storage, SQL, provider SDKs |
| Application services | Use cases such as load bootstrap, start/complete session, add plan action | Component styling, raw database access |
| Repository ports | Typed read/write interface consumed by application services | Transport- or database-specific behavior exposed to UI |
| Local demo adapter | Alex seed, session-local state, versioned localStorage serialization | Real health data, authentication claims, network dependency |
| HTTP adapter | `/api/v1` transport, error mapping, request IDs | Business rules duplicated from the server |
| Server services (later) | Authorization, runtime validation, idempotency, domain orchestration | Presentation logic, service-role credentials sent to clients |
| Supabase adapter (later) | SQL persistence, migrations, RLS-backed ownership | Product decisions or unvalidated input |
| Explore3D adapter | Renderer lifecycle, model loading, camera/selection mapping, fallback signal | Navigation, metrics, plan state, clinical interpretation |
| Analytics adapter | Allowlisted, consent-aware event delivery or local no-op | Raw sensitive metrics, free text, tokens, record contents |

Dependencies point inward: `UI -> application services -> domain/repository ports`; adapters implement ports. No presentation module imports a persistence provider directly.

## 4. Route and Feature Ownership

| Route | Feature owner | Data/use cases |
|---|---|---|
| `/` | Home | Bootstrap summary, current status, recommendation, completion progress |
| `/explore` | Explore | System catalog/details; lazily mounted Explore3D adapter |
| `/insights` | Insights | Current deterministic insight and 7-day trend |
| `/plan` | Plan | Today's plan, add-once action, start/resume/complete intervention |
| `/profile` | Profile | Demo profile and source-status transparency |
| `/session/brain-training` | Focused session | Brain-training state machine and result capture |
| `/session/breathing` | Focused session | 4/2/6 breathing state machine and feedback |

Focused session routes may hide primary navigation, but must preserve an explicit exit path and interruption confirmation.

## 5. State Ownership

1. Canonical domain state lives in the active repository implementation.
2. React components own only ephemeral presentation state: open sheet, selected tab, animation state, draft input, loading and error presentation.
3. Plan completion, session results, insight provenance, and Home progress are derived from repository state and never copied into independent feature stores.
4. P0 starts from the immutable `demo_001` seed. Mutations are applied to an in-memory snapshot and may be serialized to `sleepos.demo.v1`.
5. A schema/version mismatch or corrupt local snapshot is quarantined and reset to the canonical seed with a visible non-blocking notice; it is never silently treated as valid.
6. “Reset demo” clears only the SleepOS demo key and recreates the canonical Alex state.

## 6. The 3D Human Boundary

- Use the supplied BodyParts3D geometry and v6 skin presentation as the canonical human.
- Mount it only in a client component under Explore; Home's critical bundle must not import Three.js, GSAP, GLTFLoader, or GLBs.
- Verified mesh/layer keys are `skin`, `brain`, `eyes`, `lungs`, `heart`, and `gut`.
- Product system keys are `brain`, `heart_autonomic`, `lungs_breathing`, `gut_nutrition`, `muscle_recovery`, and `metabolic_labs`.
- `muscle_recovery` and `metabolic_labs` use explicitly labelled region overlays until verified geometry exists.
- The 3D adapter emits `system_selected`; application navigation and data lookup remain outside the scene.
- Accessible HTML system controls are authoritative. Raycasting is an enhancement, never the only selection mechanism.
- Loading has a bounded timeout and explicit retry. WebGL absence, context loss, CORS/404, or load failure switches to the static system selector without blocking the journey.
- On unmount, dispose geometries, materials, textures, renderer, animation frames/tweens, observers, and event listeners.
- Reduced motion disables auto-rotation and minimizes camera animation.

## 7. Trust Boundaries and Security

| Boundary | Required control |
|---|---|
| Browser input -> domain | Shared runtime schema validation; reject unknown enum values and impossible ranges |
| Browser -> API (later) | HTTPS, authentication, CSRF-appropriate method/cookie policy, request size limits, rate limits |
| API -> user data | Resolve user identity server-side; ownership check on every read/write; never trust request `userId` |
| Server -> Supabase (later) | Least-privilege credentials; RLS for user-scoped rows; service-role key never reaches browser |
| App -> AI provider (later) | Send minimum structured facts; timeout; schema validation; deterministic fallback; privacy-safe logs |
| App -> analytics | Allowlisted keys only; no raw health measurements, free text, tokens, or record content |
| App -> 3D assets | Approved origin, pinned/versioned assets, provenance record, caching and integrity controls where supported |

The demo identity is not authentication. It cannot be promoted to a real account or used to authorize real user data.

## 8. Failure and Degradation Policy

| Failure | Required behavior |
|---|---|
| Local snapshot unavailable/corrupt | Continue from canonical seed; explain reset; preserve app usability |
| 3D slow/fails/WebGL unavailable | Static accessible selector, retry, same details and actions |
| Insight rule lacks required fresh inputs | `no_data` or qualified result; never fabricate |
| Optional AI fails or is invalid | Use deterministic insight without blocking |
| Session save retried | Same idempotency key returns the existing result; no duplicate completion |
| Navigation during active session | Confirm abandon/continue; abandoned session never completes |
| API/Supabase unavailable in later runtime | Actionable error, bounded retry, no false success; P0 demo mode remains independently runnable |
| Analytics unavailable | Product behavior continues; event may be dropped or locally buffered within documented limits |

## 9. Non-Functional Budgets

- Reference mobile layout: 390 x 844 CSS pixels; desktop reference must be selected before Phase 1 gate.
- Explore manipulation target: at least 30 FPS on the selected reference device.
- The 3D code and assets are route-lazy and absent from Home's critical dependency graph.
- No unbounded arrays, retries, timers, or event queues.
- Local demo history retains at most 50 intervention sessions and 30 daily snapshots; oldest demo entries are removed first.
- All user-visible controls have keyboard operation, focus indication, accessible names, and reduced-motion behavior.
- Timestamps use ISO 8601 UTC on storage/API boundaries; local date keys use `YYYY-MM-DD` in the user's selected timezone.

## 10. Change Control

The following are contract changes and require synchronized edits:

- Domain entity/field changes -> `DATABASE_SCHEMA.md` and `SHARED_KEYS.md`.
- Request, response, error, auth, or idempotency changes -> `API.md`.
- New cross-layer enum/event/storage/environment key -> `SHARED_KEYS.md`.
- A changed trust boundary, repository strategy, or runtime dependency -> this document and an ADR.
- Supabase activation -> migration, RLS policy, rollback, privacy review, and an explicit Phase 4 gate; it is not a P0 prerequisite.

Independent review is still required before this architecture is approved.
