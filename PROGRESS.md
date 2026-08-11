# PROGRESS.md

## Project Status

- Current Phase: Local P0 competition demo complete
- Overall Status: Independently reviewed and verified; public production release not approved
- Last Updated: 2026-08-11 02:47 +08:00
- Orchestrator: `Codex`
- Runtime: Local synthetic demo; no real health data, auth, Supabase, AI provider, or analytics provider

---

## Phase 1 — Foundation

**Goal:** Establish product scope, architecture, contracts, application shell, and canonical demo state.

### Task 1.1 — Product requirements and contracts

- Status: Complete
- Priority: P0
- Implementers: `Codex`, `architecture_contracts`
- Deliverables:
  - [x] Point-by-point phased PRD and release boundaries
  - [x] System architecture and critical data flows
  - [x] API, future database, shared-key, state, safety, and 3D contracts
  - [x] LocalDemoRepository boundary; Supabase/real data deferred
- Validation:
  - [x] Contract JSON and placeholder checks passed
  - [x] Runtime implementation traced against canonical keys
  - [x] Independent review passed
- Signature: `architecture_contracts | authored`; `independent_review | approved 2026-08-11`

### Task 1.2 — Frontend foundation

- Status: Complete
- Priority: P0
- Implementer: `app_foundation`
- Deliverables:
  - [x] Next.js 16 / React 19 / TypeScript application and lockfile
  - [x] Five-destination responsive shell
  - [x] Canonical Alex synthetic demo data
  - [x] Home, Profile, loading, error, not-found, focus, and reduced-motion foundations
- Validation:
  - [x] Lint, typecheck, unit tests, and production build passed
  - [x] Mobile and desktop browser checks passed
- Signature: `app_foundation | implemented and validated`; `independent_review | approved 2026-08-11`

### Phase 1 Gate

- [x] Required P0 foundation work complete
- [x] Contracts synchronized
- [x] Independent review passed
- [x] Required static and browser tests passed
- Approved By: `independent_review`
- Signature: `Codex | 2026-08-11 02:47 +08:00`

---

## Phase 2 — Core P0 Experience

**Goal:** Implement the supplied 3D human, explainable Insights, daily Plan, interventions, and closed-loop demo state.

### Task 2.1 — Explore and BodyParts3D

- Status: Complete for local competition demo
- Implementer: `explore_3d`
- Deliverables:
  - [x] Supplied BodyParts3D human and smooth v6 skin retained
  - [x] Verified Brain, Heart, Lungs, and Gut layers
  - [x] Two explicitly non-anatomical Muscle/Metabolic regional overlays
  - [x] Accessible six-system controls and detail sheets
  - [x] Deep-link selection, rotation/zoom/reset, loading/error/timeout/WebGL fallbacks
  - [x] Script-only sandbox, exact message-source validation, CSP/CORS boundary, context-loss and reduced-motion handling
  - [x] Three.js, GSAP, loaders, and both GLBs vendored locally with SHA-256 manifest
- Validation:
  - [x] Model module syntax, TypeScript, lint, unit tests, build, and browser runtime passed
  - [x] 390 px viewport has 390 px document width
  - [x] Zero browser console/page errors
- Limitation: Regional overlays are fixed stage coordinates and do not track body rotation/zoom.
- Signature: `explore_3d | implemented`; `independent_review | approved for demo P0`

### Task 2.2 — Insights, Plan, and intervention loop

- Status: Complete for local competition demo
- Implementer: `Codex`
- Deliverables:
  - [x] Deterministic, cautious top Insight with visible rule provenance and seven-day trend
  - [x] Three-action Plan and explicit pending/active/completed states
  - [x] Working five-trial attention task with timeout, median reaction, accuracy, misses, baseline comparison, UUID, discard/abandon flow, and idempotent save
  - [x] 4/2/6 breathing timer with pause, background pause, feedback, abandonment, and persisted session
  - [x] Confirmed sleep-goal time input
  - [x] Versioned, bounded, runtime-validated local demo snapshot
  - [x] Completion updates Plan, session history, and Home progress
- Validation:
  - [x] Full Home → Insights → Plan → three completions → Home journey passed
  - [x] Home updated from 0/3 to 3/3
  - [x] Independent review passed
- Signature: `Codex | implemented`; `independent_review | approved for demo P0`

### Phase 2 Gate

- [x] P0 frontend experience complete
- [x] Contract consistency verified
- [x] Independent review passed
- [x] Documentation synchronized
- Approved By: `independent_review`
- Signature: `Codex | 2026-08-11 02:47 +08:00`

---

## Phase 3 — Integration, QA, and Release Boundary

### Verification Evidence

- [x] `npm run lint` — pass, zero errors
- [x] `npm run typecheck -- --incremental false` — pass
- [x] `npm test` — 4 files, 13/13 tests pass
- [x] `npm run build` — Next.js 16.3 production build pass
- [x] Browser QA — all five routes, 390 × 844 journey, 3/3 completion, updated Home, Explore deep link/model/overlays
- [x] Browser console and page errors — none
- [x] Mobile document overflow — none (`390 / 390`)
- [x] Extended Playwright audit — canonical Home metric deep links, Profile section anchors, navigation abandonment, all-timeout attention result, corrupt snapshot recovery, Explore asset-failure fallback, keyboard dismissal, and desktop overflow all pass
- [x] Browser-found defects fixed — HRV now selects `heart_autonomic`; assessment and record actions reveal their addressable Profile sections
- [x] Independent final review — local P0 demo sign-off granted

### Release Classification

- Local competition demo: Approved
- Pilot with real user/health data: Not approved; Phase 4 persistence/auth/privacy/RLS work not implemented
- Public production release: Not approved

### External Public-Release Blocker

- Product owner must confirm ownership and redistribution license for `body.glb` and `skin-v6.glb`. Checksums and supplied origins are recorded in `frontend/public/explore/ASSET_MANIFEST.md`.

### Phase 3 Gate

- [x] Local P0 E2E passed
- [x] Local demo security boundary reviewed
- [x] No unresolved local-demo P0 implementation blocker
- [x] Documentation synchronized
- [ ] Public deployment authorization and GLB license confirmed
- Approved By: `independent_review` for local competition demo only
- Signature: `Codex | 2026-08-11 02:47 +08:00`

## Phase 4 — Local-demo onboarding and consultation slice

- Status: Implemented and locally verified; independent review pending
- Scope: Synthetic Alex onboarding and simulated consultation only
- Deliverables:
  - [x] `/onboarding` goals, sleep baseline, measured assessment/skip, wearable demo/skip, summary, and Home entry
  - [x] Versioned `sleepos.onboarding.v1` draft with bounded runtime validation, refresh resume, and visible invalid-state recovery
  - [x] Profile onboarding entry point and deterministic step-heading focus transfer
  - [x] Native consultation dialog with two simulated slots, demo contact option, truthful no-booking confirmation, and Escape dismissal
- Validation:
  - [x] Lint and TypeScript pass
  - [x] 5 files / 16 unit tests pass
  - [x] Next.js production build passes with `/onboarding` prerendered
  - [x] Full Playwright regression passes; representative onboarding completes in 12.3 seconds at 390 × 844
  - [x] Refresh resume, empty goal/time validation, invalid snapshot reset, measured assessment save-once, mobile focus, and consultation keyboard paths pass
- Review: React/Next.js self-review completed; builder-independent review is still required by the project gate
- Signature: `Codex | implemented and locally verified | 2026-08-11`

## Active Blockers

- Public production only: GLB ownership/redistribution license confirmation.
- Real-data pilot: authentication, Supabase migrations/RLS, consent, retention, deletion/export, privacy/security review, and operational ownership remain future work.

## Cross-Agent Handoff

- The next implementation wave is the remaining gated Phase 4 foundation from `docs/PRODUCT_REQUIREMENTS.md`; do not treat either localStorage demo key as production persistence.
- Do not run database migrations or enable real health data until the Phase 4 security/privacy gate is approved.
- Preserve the canonical model and asset hashes when changing the Explore viewer.
