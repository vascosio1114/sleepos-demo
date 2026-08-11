# SleepOS

SleepOS is a mobile-first sleep and brain wellness competition demo built around an assess → train → sleep → measure → adapt loop.

The local P0 demo includes Home, the supplied BodyParts3D Explore human, deterministic Insights, a daily Plan, working attention and breathing sessions, Profile source transparency, and closed-loop progress. See `PROGRESS.md` for the exact verified release boundary.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

## Core control files
- `docs/PRODUCT_REQUIREMENTS.md` — canonical product scope, phased delivery plan, and acceptance criteria.
- `CLAUDE.md` — agent rules and workflow.
- `docs/MASTER_PLAN.md` — canonical task breakdown and parallel dependency map.
- `PROGRESS.md` — phase-by-phase signed execution ledger.
- `docs/DATABASE_SCHEMA.md` — database source of truth.
- `docs/API.md` — API contract source of truth.
- `docs/SHARED_KEYS.md` — shared naming/key registry.

## Execution model
Plan → split → parallelize by dependency → implement → verify → independent review → document → sign → phase gate.

## Agent workspace navigation
Agents should read: `CLAUDE.md` → `PROGRESS.md` → `docs/MASTER_PLAN.md` → assigned task file → relevant canonical contract docs.
All progress, schema, API, shared-key, and architectural decisions must be logged in their designated canonical files rather than scattered notes.
