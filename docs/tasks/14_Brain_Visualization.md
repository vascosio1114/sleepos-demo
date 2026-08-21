# Task 14 — Body / Brain Visualization Refinement (Phase 4)

## Goal

Make the Brain mode on Explore rich enough to demonstrate the Body / Brain / Body/Brain split and the Consumer layer (per A2A plan §6.2) without committing to real assessment data. Drill into each functional domain with a 7-day mini-trend and educational region context, all clearly labelled as contextual rather than measured.

## Status

- **State:** Drafted; in progress
- **Priority:** P1
- **Owner:** `brain_visualization_implementer`
- **Last updated:** 2026-08-19
- **Builds on:** Task 11 (mock-mode Brain view at `/explore?view=brain`)

## Scope

### In Scope

1. Explore Brain view drill-down:
   - Click a domain card → expanded panel with 7-day history mini-trend (sparkline)
   - Show source metric keys, quality flag, capture timestamp, baseline comparison
   - Show the deterministic engine's note for that domain
3. Educational region context (Consumer layer only):
   - 10 brain region labels with one-line functional description (frontal, prefrontal, parietal, temporal, occipital, central, amygdala, hippocampus, cingulate, insula)
   - Each labelled `contextual, not directly measured` per A2A §6.2
   - Shown when a domain is selected, not on the overview grid
4. Empty / loading / error states + manual refresh button
5. Updated CSS module for the new layout

### Out of Scope (deferred)

- **Trainer / assessment layer** (per A2A §6.2): QEEG / HEG data, regional scores, 5D dimensions — blocked until real assessment source + privacy / clinical review
- Real wearable integration
- New API endpoints (use existing `/api/v1/brain-scores/current` + `/history`)
- Modifying the Body mode 3D viewer

## Dependencies

- Task 11 (mock-mode Brain view) — done
- Existing API routes: `GET /api/v1/brain-scores/current`, `GET /api/v1/brain-scores/history?limit=30`

## Contracts Affected

None — reuses existing BrainScoreSnapshot contract and BrainDomain enum. UI enhancement only.

## Phased Delivery

- [ ] Task file
- [ ] ExploreBrainView drill-down + history + region context
- [ ] CSS module updates
- [ ] Lint + typecheck + test + build
- [ ] PROGRESS + MANUAL_TEST update

## Error / State Requirements

- [x] `loading` — explicit loading indicator on mount
- [x] `empty` — clear copy when no snapshot exists
- [x] `success` — drill-down + history + region context
- [x] `error` — explicit message + retry
- [x] `partial-success` — snapshot exists but no history

## Acceptance Criteria

- [ ] Each domain card is clickable; clicking expands a drill-down panel
- [ ] Drill-down panel renders a 7-day mini-trend from `/brain-scores/history`
- [ ] Drill-down shows source metric keys, quality flag, capture timestamp, baseline comparison
- [ ] Drill-down shows 10-region educational context with `contextual, not directly measured` disclaimer
- [ ] Empty state surfaces `No recent data` and the wellnessScope copy
- [ ] Refresh button re-fetches current + history
- [ ] No raw audio, no PII, no real assessment data anywhere in the panel
- [ ] Mobile (390 × 844) layout fits without horizontal scroll

## Validation

- [ ] Lint + typecheck + test + build pass
- [ ] Manual test checklist §5 updated
- [ ] No new provider keys, no real assessment data added

## Risks / Notes

| Risk | Mitigation |
|---|---|
| Region labels read as medical claims | Each label carries `contextual, not directly measured`; layout groups them under a single disclaimer banner |
| Drill-down invites scrutiny that scores are brain measurements | Use `measured` flag from snapshot contract; don't show 5D; highlight `demo` / `self_report` / `cognitive_task` mode |
| History trend misinterpretation | Trend is labelled `Demo trend only`; not labelled as a clinical signal |
| Adds complexity to demo | Drill-down is optional; overview grid remains the default |

## Ownership / Signatures

- Implementer: `brain_visualization_implementer | 2026-08-19 | drafted, not independently approved`
- Reviewer: `independent_review | pending`
- Clinical / Wellness: `pending_external` (region labels remain educational, not clinical)