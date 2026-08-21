# MASTER_PLAN.md

## Project
- Name: `SleepOS`
- Source Requirements: `docs/PRODUCT_REQUIREMENTS.md`
- Last Updated: `2026-08-11`

## Breakdown Principles
- Every task is independently deliverable, testable, reviewable, and demoable.
- Minimize strong dependencies and explicitly identify parallel work.
- Break each task into phases from foundational/easy → complex.
- Complete P0/core before P1/extensions unless dependencies justify otherwise.
- Frontend and backend are separate workstreams connected through canonical contracts.

## Product Delivery Phases

The canonical phase scope and phase exit gates are defined in `PRODUCT_REQUIREMENTS.md`:

| Phase | Outcome |
|---|---|
| 0 | Requirements, contracts, asset provenance, and safety foundation |
| 1 | Responsive application shell and trustworthy demo data |
| 2 | Supplied BodyParts3D human, Explore, and explainable Insights |
| 3 | Plan, working interventions, and closed-loop completion |
| 4 | Persistence, onboarding, assessment, and bounded AI |
| 5 | Integrated QA, security, performance, and release proof |

## Task Index
| ID | Task | Priority | Dependencies | Parallel With | Owner | Task File |
|---|---|---|---|---|---|---|
| 01 | Architecture & Contracts | P0 | None | — | Architect | `tasks/01_Architecture_Contracts.md` |
| 02 | Database Foundation | P0 | 01 | 03 | Database Agent | `tasks/02_Database.md` |
| 03 | Frontend Foundation | P0 | 01 | 02 | Frontend Agent | `tasks/03_Frontend.md` |
| 04 | Backend Core | P0 | 01,02 | 03 | Backend Agent | `tasks/04_Backend.md` |
| 05 | Integration | P0 | 03,04 | — | Integration Agent | `tasks/05_Integration.md` |
| 06 | QA / Playwright | P0 | 05 | 07 | QA Agent | `tasks/06_QA.md` |
| 07 | Security Review | P0 | 02,04,05 | 06 | Security Agent | `tasks/07_Security.md` |
| 08 | Release / Hardening | P1 | 06,07 | — | Orchestrator | `tasks/08_Release.md` |
| 09 | Demo Onboarding & Consultation | P1 | 03,05 | — | Frontend Agent | `tasks/09_Onboarding_Consultation.md` |
| 10 | Voice / AI Advice / Brain Score Contracts | P1 | 01 | 02,03 | Architect | `tasks/10_Voice_Advice_Contracts.md` |

## Recommended Execution Waves
- **Wave 1 — Foundation:** 01
- **Wave 2 — Parallel Foundations:** 02 / 03
- **Wave 3 — Core Backend + continuing Frontend:** 04 / 03
- **Wave 4 — Integration:** 05
- **Wave 5 — Parallel Validation:** 06 / 07
- **Wave 6 — Release / Hardening:** 08
- **Wave 7 — Pilot-safe local UX:** 09 (onboarding and simulated consultation only; no real-data activation)
- **Wave 8 — Voice / AI Advice / Brain Score stream (additive):** 10 (contract authoring now; Phases 1–5 of `A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` queue behind Tasks 11–15)
- **Cross-cutting:** docs, contract sync, progress signatures, independent review.

## Phase Gates
- A task cannot be complete without acceptance criteria and independent review.
- Dependent work starts only when required contracts/dependencies are stable.
- Prefer parallel work whenever no real dependency exists.
