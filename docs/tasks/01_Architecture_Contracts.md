# Task 01 — Architecture & Contracts

## Goal

Turn the SleepOS PRD into stable, independently implementable MVP boundaries before frontend, database, and backend work proceeds.

## Status

- **State:** Complete; consistency validation and independent review passed
- **Priority:** P0
- **Owner:** System Architect agent
- **Last updated:** 2026-08-11
- **Approval:** Approved for the local P0 competition demo

## In Scope

1. Local-first P0 runtime and optional later Supabase topology.
2. UI/domain/repository/3D/analytics trust and ownership boundaries.
3. Canonical bootstrap, insight, plan, and intervention service/API contracts.
4. Canonical future relational entities, constraints, indexes, RLS requirements, and migration boundary.
5. Shared IDs, metric units, enums, transitions, analytics payloads, storage keys, environment keys, and safe errors.
6. Critical data flows, idempotency, atomicity, fallback, and recovery behavior.
7. Supplied BodyParts3D adapter boundary and verified layer/system mapping.

## Out of Scope

- Application/frontend implementation or package selection.
- Database migration execution, Supabase project creation, or real auth.
- Uploads, real wearable connections, real scheduling, or production analytics.
- AI provider integration; P0 insight remains deterministic.
- Asset licensing approval or controlled GLB hosting itself.
- Product-owner decisions O-01 through O-10 that require external approval.

## Dependencies

- `docs/PRODUCT_REQUIREMENTS.md` — canonical product baseline.
- User-supplied `bodyparts3d_glass_v12_1_v6skin_fixed.html` — canonical human behavior/prototype facts.
- No runtime or database dependency for contract authorship.

## Deliverables

| Deliverable | Canonical file | Authored | Independent review |
|---|---|---:|---:|
| System architecture and trust boundaries | `docs/architecture/SYSTEM.md` | Yes | Passed |
| Critical data flows and recovery | `docs/architecture/DATA_FLOW.md` | Yes | Passed |
| Service/HTTP API v1 | `docs/API.md` | Yes | Passed |
| Future Supabase/Postgres schema contract | `docs/DATABASE_SCHEMA.md` | Yes | Passed |
| Shared naming/enums/events/environment registry | `docs/SHARED_KEYS.md` | Yes | Passed |

## Contract Decisions

1. P0 is a synthetic, local-first demo using `LocalDemoRepository`; it requires no Supabase, account, AI, analytics provider, or backend process.
2. UI consumes application services/repository ports, so a later HTTP/Supabase adapter can replace local persistence without rewriting feature components.
3. `sleepos.demo.v1` may retain bounded synthetic mutations; invalid snapshots reset safely to the canonical Alex seed.
4. The supplied human is isolated to an Explore client island. Accessible HTML controls and static fallback share the same `SystemKey` contract.
5. Plan/action/session completion is committed as one atomic use case and is idempotent.
6. Deterministic insight rules own facts, status, evidence, and action. Later AI can only refine validated wording.
7. Real-user persistence is Phase 4 and remains blocked on environment, retention, consent, migration, RLS, privacy, and security review.

## Phased Work

### A. Establish runtime boundaries — complete (authored)

- Define routes, layers, dependency direction, local demo adapter, later authenticated adapter, 3D isolation, failure policy, and trust boundaries.

### B. Freeze cross-layer names — complete (authored)

- Define metric units, product system/model-layer mapping, action/session states, rule IDs, analytics allowlists, storage keys, and environment variables.

### C. Define transport and persistence contracts — complete (authored)

- Define versioned envelopes, operations, idempotency, atomic completion, future table constraints/indexes/RLS, and migration boundaries.

### D. Independent review and freeze — pending

- Reviewer traces each P0 PRD requirement through system, data-flow, API/schema, and keys.
- Architect fixes findings and reruns consistency checks.
- Reviewer, not author, records approval in `PROGRESS.md` and this task.

## Acceptance Criteria

- [x] P0 can be implemented and run locally without Supabase or optional providers.
- [x] The UI has no direct database, provider, or Three.js-owned business state.
- [x] Bootstrap produces one consistent read model for all primary screens.
- [x] System, metric, action, session, source, status, and error vocabularies are explicit.
- [x] Brain-training and breathing transitions include interruption, abandonment, retry, and duplicate protection.
- [x] Session completion atomically updates session, plan action, and derived progress.
- [x] Deterministic insight provenance and AI fallback boundaries are explicit.
- [x] Verified 3D layers and muscle/metabolic overlay gaps are represented truthfully.
- [x] Future schema documents ownership, checks, unique constraints, indexes, RLS, retention gaps, migration, and rollback boundaries.
- [x] Analytics payloads exclude raw health values and sensitive content.
- [x] API error envelopes, versioning, auth modes, time formats, and idempotency are explicit.
- [x] Controlled local hosting, checksums, and versioned asset manifest implemented.
- [ ] GLB ownership/redistribution license approved (O-03; external public-release blocker).
- [ ] Product owner selects demo/pilot claim and resolves remaining blocking PRD decisions.
- [x] Independent architecture/contracts review passes for local P0 demo.

## Validation Evidence

- Manual cross-document trace performed against PRD sections 5-10, 12-16.
- Canonical values checked: Alex metrics/baselines, five destinations, six system keys, six verified model layers, three plan actions, 4/2/6 breathing timing, allowed statuses, and event names.
- Documentation checks must verify no placeholder table/endpoint/enum remains, all Markdown files are readable UTF-8, and required P0 strings are present.
- No runtime tests apply because this task changes documentation only.

## Risks and Open Handoffs

| Risk/decision | Handoff |
|---|---|
| Product owner/reviewer unassigned | Orchestrator assigns owner and independent reviewer (O-01) |
| Demo vs pilot claim unset | Product owner approves P0 as competition demo; real data remains disabled (O-02) |
| GLB provenance/control unset | 3D/asset owner records license, checksum, version, origin (O-03) |
| Muscle/metabolic meshes absent | Frontend uses labelled `region_overlay` per contract (O-04) |
| Device/browser matrix unset | QA/product selects references before Phase 1 gate (O-05) |
| Training protocol not clinically validated | Implement as labelled demonstration; product/safety approves protocol before Phase 3 (O-06) |
| Supabase topology/retention unset | Database/security owner resolves before migrations or real data (O-08) |
| Analytics provider/consent unset | Keep adapter disabled/local in P0 (O-09) |

## Reviewer Sign-off

- Reviewer: `independent_review`
- Findings: Contract drift, state recovery, 3D isolation, mobile overflow, and asset-control findings resolved; GLB license remains external.
- Approval timestamp: `2026-08-11`
- Author signature: `System Architect agent | 2026-08-11 | authored, not independently approved`
