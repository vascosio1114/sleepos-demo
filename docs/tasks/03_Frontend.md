# 03 Frontend Foundation

## Goal

Deliver the responsive Next.js application foundation, canonical demo context, and trustworthy Home and Profile surfaces required by Phase 1.

## Scope

- In: package and toolchain configuration, App Router shell, five primary destinations, design tokens, responsive navigation, Home, Profile, typed demo data, and loading/error/not-found states.
- Out: Explore 3D implementation, insight logic, Plan sessions, persistence, authentication, and external integrations.

## Dependencies

- `docs/PRODUCT_REQUIREMENTS.md`
- Canonical shared keys and API contracts as they stabilize.

## Deliverables

- [x] Next.js 16 / React 19 TypeScript foundation
- [x] Desktop rail and mobile five-item navigation
- [x] Canonical synthetic Alex demo object
- [x] Home status, three metrics, and one recommendation
- [x] Profile sources with explicit demo/simulated/disconnected states
- [x] Loading, recovery, and not-found surfaces
- [x] Reduced-motion and keyboard-focus foundations
- [x] Independent visual and code review

## Acceptance criteria

1. Home presents only Sleep, HRV, and Reaction as primary metrics.
2. All five primary destinations are keyboard reachable at mobile and desktop sizes.
3. Visible Home and Profile values resolve from the same canonical demo object.
4. No source is represented as live when it is demo, simulated, dated, or disconnected.
5. The Home route does not import the Explore feature or 3D dependencies.
6. Lint, typecheck, unit tests, and production build pass after feature integration.

## Risks and notes

- Current state is competition-demo state; no real health data or connected sources are enabled.
- Final responsive/browser acceptance and independent review remain integration gates.
- Integration gates passed for the local P0 competition demo on 2026-08-11.
- 3D, Plan, and Insights are owned by parallel workstreams and replace route placeholders without changing the shell.
