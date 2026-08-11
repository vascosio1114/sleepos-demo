# 09 Demo Onboarding and Consultation

## Goal

Advance the Phase 4 user experience with a recoverable Alex demo onboarding flow and a truthful simulated consultation modal without enabling real accounts, uploads, AI, or health-data persistence.

## Scope

- In: `/onboarding`, synthetic improvement goals, short sleep baseline, start/skip existing demo attention assessment, demo wearable/skip choice, refresh resume, validation/back paths, Profile entry point, and simulated consultation options.
- Out: Supabase, real authentication, real wearable connections, real bookings/contact delivery, uploads, AI providers, and any real personal or health data.

## Dependencies

- `docs/PRODUCT_REQUIREMENTS.md` ONB-01, ONB-02, ONB-03, and PLAN-09.
- Existing canonical Alex seed, Plan provider, attention task, and `sleepos.demo.v1` boundary.
- New local-only key `sleepos.onboarding.v1` in `docs/SHARED_KEYS.md`.

## Deliverables

- [x] Addressable Alex demo onboarding route with four short input stages.
- [x] Runtime-validated, versioned local draft with reset notice and refresh resume.
- [x] Back, skip, validation, assessment start/save, wearable demo/skip, and Home completion paths.
- [x] Profile entry point for starting or resuming onboarding.
- [x] Accessible simulated consultation modal with demo slots and a contact option.
- [x] Unit and Playwright regression coverage.

## Acceptance Criteria

1. A representative skip path reaches Home in under two minutes without manual storage edits.
2. At least one goal is required and no more than three accepted goals can be persisted.
3. Accepted answers survive refresh; invalid snapshots reset visibly and safely.
4. Starting the assessment reuses the existing measured attention task; closing it does not falsely complete onboarding.
5. Skipped assessment and wearable decisions are explicit in the completed draft.
6. Consultation choices are clearly simulated and create no booking or external message.
7. Mobile and desktop layouts, keyboard operation, lint, typecheck, tests, build, and browser QA pass.

## Risks and Notes

- This is a synthetic local-demo workflow, not pilot authentication or consent.
- The draft is deliberately separate from `sleepos.demo.v1` and is never auto-uploaded to a future account.
- Independent review is required before this task is marked complete.
- Implementation and local verification passed on 2026-08-11; independent review remains pending.
