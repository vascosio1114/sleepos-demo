# SleepOS Product Requirements Document

## Sleep & Brain Intelligence Platform — Website MVP

## 0. Document Control

| Field | Value |
|---|---|
| Product | SleepOS |
| Release | Website MVP / competition and pilot demonstration |
| Status | Build-ready product baseline; independent review pending |
| Product type | Mobile-first responsive web application |
| Primary audience | Adults with stress-related poor sleep and reduced daytime performance |
| Product owner | To be assigned |
| Last updated | 2026-08-11 |
| Source brief | User-supplied Sleep & Brain Intelligence Platform specification |
| Required human visualization | `bodyparts3d_glass_v12_1_v6skin_fixed.html` supplied by the product owner |

This document is the canonical product requirements source for the MVP. Architecture, API, database, shared-key, design, and task documents must remain consistent with it.

---

## 1. Executive Product Definition

### 1.1 Problem

The user knows they are sleeping badly but cannot easily understand:

1. What changed.
2. Which sleep-related factors may be relevant.
3. What low-risk action to take today.
4. Whether the action was completed.
5. Whether sleep, recovery, or cognitive performance changed afterward.

### 1.2 Product proposition

SleepOS is a brain-training-centered sleep wellness platform. It combines sleep, HRV, stress, breathing, recovery, cognitive performance, and selected contextual health data to create one repeatable loop:

**Assess → Train → Sleep → Measure → Adapt**

Consumer promise:

> Understand your sleep. Train your brain. Measure what changes.

### 1.3 Product hierarchy

1. Sleep is the problem the user wants to improve.
2. Brain training is the core intervention demonstrated by the product.
3. AI explains observations and personalizes low-risk next actions.
4. Whole-body data provides context; it is not a diagnostic engine.
5. The closed feedback loop is the product.

### 1.4 MVP completion definition

The MVP is complete only when the demo user can finish this persisted flow:

**Home → Explore → Insight → Plan → Brain Training → Completion → Updated Home/Plan status**

The supplied BodyParts3D human must be integrated into Explore, and the entire flow must share one premium, quiet, dark visual system.

---

## 2. Goals, Outcomes, and Boundaries

### 2.1 MVP goals

The MVP shall prove that a user can:

1. Understand current sleep and brain status in under five seconds on Home.
2. Explore body systems that may be related to sleep using the supplied interactive 3D human.
3. complete or review a brain baseline assessment.
4. Receive a short, cautious, explainable interpretation.
5. Receive a daily plan containing no more than three priorities.
6. Complete at least one functioning brain-training task.
7. Complete a guided breathing exercise.
8. See intervention results and completion state recorded consistently.
9. Understand where wearable, assessment, and record data comes from.
10. Understand how future data integrations fit without implying that they already work.

### 2.2 Non-goals and prohibited scope

The MVP shall not provide or claim:

1. Medical diagnosis or a whole-body diagnostic engine.
2. Treatment of insomnia or another health condition.
3. A physician replacement or general medical chatbot.
4. Medication initiation, cessation, or dosing advice.
5. Live EHR, hospital, microbiome-lab, CGM, TCM-engine, billing, or insurance integration.
6. A sophisticated clinician dashboard.
7. Dozens of wearables, a complete nutrition tracker, community features, or social features.
8. A full 3D anatomy database.
9. Real scheduling where a simulated consultation flow is sufficient.
10. Causal claims derived from correlations.

### 2.3 Product inclusion test

Every proposed feature must answer yes to at least one question:

1. Does it help assess the user's sleep-and-brain state?
2. Does it help the user complete a targeted intervention?
3. Does it measure an outcome or adherence?
4. Does it safely adapt the next action?

Features that answer no are excluded from the MVP.

---

## 3. Users and Jobs to Be Done

### 3.1 Primary user

Stress-related poor sleepers: adults who have difficulty falling asleep, experience mentally active evenings, poor sleep quality, unrefreshing sleep, stress, or reduced daytime focus. They may already own a wearable but do not know how to act on its data.

### 3.2 Demo persona

**Alex, age 35** — a professional or entrepreneur who sleeps roughly six to seven hours, works late, reports high stress, uses a wearable, and is willing to complete short daily exercises.

Primary job:

> Help me understand why I may not be recovering and tell me what useful action I can take tonight.

### 3.3 Secondary future users

The architecture may later support performance professionals, athletes, wellness clinics, neurofeedback practitioners, executive-health services, psychologists, sleep-wellness providers, and research partners. Their portals and workflows are not part of this MVP.

---

## 4. Experience Principles

1. **Action over analytics:** each primary screen answers one user question.
2. **Brain training first:** it is the first plan priority and the core intervention.
3. **One interpretation:** Insights proactively presents the highest-priority observation instead of an empty chat surface.
4. **Cautious explanations:** use association language and expose supporting metrics.
5. **Limited choices:** Home has at most three key metrics; Plan has at most three daily actions.
6. **Progress is visible:** completion must update Plan, Home, and session history.
7. **Demo truthfulness:** simulated devices, uploads, records, and appointments must be labelled Demo or Simulated.
8. **Nighttime calm:** visual hierarchy is quiet, legible, and restrained rather than neon or alarmist.
9. **Mobile first:** the reference viewport is 390 × 844 px; desktop adapts without becoming a dense dashboard.
10. **No dead ends:** each status or insight offers a relevant next action, dismissal, or return path.

---

## 5. Information Architecture and Navigation

### 5.1 Primary navigation

The product shall expose exactly five primary destinations:

1. Home
2. Explore
3. Insights
4. Plan
5. Profile

The bottom navigation remains visible on mobile except during focused training or breathing sessions. AI, Brain, Devices, Reports, Data, Consultation, and Tests shall not become primary tabs.

### 5.2 Screen ownership

| Screen | Question answered | Required content |
|---|---|---|
| Home | How are my sleep and brain today? | Status, three metrics maximum, key change, recommended action |
| Explore | What body systems may be related to my sleep? | Supplied 3D human, selectable systems, status sheet, contextual actions |
| Insights | What might explain this pattern? | One top insight, supporting metrics, 7-day trend, next action |
| Plan | What should I do today? | Three priorities maximum, execution and completion states |
| Profile | Where does my information come from? | Devices, assessments/tests, records, minimal settings |

---

## 6. Functional Requirements

### 6.1 Home

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| HOME-01 | Show a personalized greeting and concise status context. | P0 | Alex sees “Good morning, Alex” and a sleep-and-brain status description. |
| HOME-02 | Show no more than three primary metrics. | P0 | Sleep `6h 18m`, HRV `42 ms`, and Reaction `312 ms` or Focus `78` appear; a fourth primary metric does not. |
| HOME-03 | Show one primary status. | P0 | “Recovery may need attention” explains that sleep is shorter and HRV is below baseline, with Attention status. |
| HOME-04 | Show one primary recommendation. | P0 | A Start button launches the recommended session; View Plan opens Plan. |
| HOME-05 | Make metric cards actionable. | P0 | A metric opens its relevant Explore system or Insight detail with navigation context preserved. |
| HOME-06 | Reflect completed actions. | P0 | Completing training updates progress and status without requiring a page reload in the active session. |

### 6.2 Explore and the required 3D human

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| EXP-01 | Use the supplied BodyParts3D HTML implementation as the human visualization baseline. | P0 | The resulting human retains the supplied model's shape, smooth v6 skin, optimized internal anatomy, framing, and dark-glass visual character. It is not replaced with a generic human asset. |
| EXP-02 | Preserve direct manipulation. | P0 | Pointer/touch drag rotates horizontally, vertical tilt is constrained, wheel/pinch zoom works, and Reset returns to a stable full-body view. |
| EXP-03 | Preserve guided focus. | P0 | Selecting a label highlights the system, focuses the camera, and opens an accessible detail sheet. Closing returns to the previous Explore state. |
| EXP-04 | Support the relevant sleep systems. | P0 | Brain, Heart/autonomic, Lungs/breathing, Gut/nutrition, Muscle/recovery, and Metabolic/labs are represented without adding unrelated anatomy. |
| EXP-05 | Connect systems to actions. | P0 | Brain can open brain training or brain insight; Lungs can open breathing; other systems open the relevant insight, assessment, recovery, or records view. |
| EXP-06 | Degrade safely. | P0 | Loading, timeout, WebGL-unavailable, reduced-motion, and model-load-error states provide a usable system list and retry action. No blank canvas is shown as success. |
| EXP-07 | Meet mobile performance and legibility targets. | P0 | Labels do not overlap primary navigation or sheets at 390 × 844; interaction remains usable at 30+ FPS on the agreed reference mobile device. |
| EXP-08 | Support accessible non-3D navigation. | P0 | Every selectable system is available by keyboard and screen-reader-operable controls independent of mesh picking. |

#### 6.2.1 Supplied-model integration contract

The supplied HTML currently establishes these implementation facts:

1. Three.js `0.160.0` renders the scene.
2. GSAP `3.12.5` performs selection and camera animations.
3. GLTFLoader loads optimized organ and v6 skin assets.
4. Verified named layers are `skin`, `brain`, `eyes`, `lungs`, `heart`, and `gut`.
5. The outer shell uses separate depth, translucent fill, and rim materials.
6. Existing controls include auto/manual rotation, reset, layer panel, zoom, drag, tilt, pinch, labels, and camera focus.
7. The prototype loads `body.glb` and `skin-v6.glb` from two external Vercel URLs.

Implementation rules:

1. Preserve the supplied geometry and skin presentation as the canonical human.
2. Integrate the renderer as an isolated client-only component so it does not block the rest of the page or server rendering.
3. Keep application data and navigation outside the Three.js scene; the scene emits a canonical `system_selected` action.
4. Retain HTML controls and labels as the accessible interaction source; mesh raycasting may supplement but not replace them.
5. During prototyping, the current remote GLB URLs may be used. Before release, asset ownership and licensing must be recorded and the GLBs must be served from an approved, controlled origin with caching and integrity/version controls.
6. If the GLBs fail, show a static silhouette/system selector with the same detail sheets and actions.
7. Respect `prefers-reduced-motion` by disabling auto-rotation and shortening nonessential camera animation.
8. Dispose renderer, textures, geometries, materials, animation handles, and event listeners when Explore unmounts.
9. Lazy-load the 3D bundle on Explore and prevent it from inflating the critical Home route bundle.
10. Do not claim that a system is anatomically selectable unless its geometry or region mapping has been verified.

Known model gap:

- The supplied HTML does not expose verified `muscle` or `metabolic` meshes.
- For MVP, these systems shall use clearly labelled body-region hotspots/overlays anchored to the supplied human and the same detail-sheet contract.
- They shall not be presented as precise anatomical organ meshes.
- A later verified GLB revision may replace the overlays without changing the product-level system keys.

#### 6.2.2 System details

| System | Status and metrics | Primary action |
|---|---|---|
| Brain | Attention; attention 78/100; reaction 312 ms; stress regulation 64/100 | Start brain training; View brain insight |
| Heart / Autonomic | Attention; HRV 42 ms; resting HR 72 bpm; trend down 12% | View insight |
| Lungs / Breathing | Good; SpO₂ 98%; respiratory rate 14/min | Start breathing session |
| Gut / Nutrition | Stable; microbiome assessment 18 Jul; nutrition needs attention | View assessment |
| Muscle / Recovery | 73/100; moderate load; recovering | View recovery |
| Metabolic / Labs | Good; ALT, AST, and glucose shown as normal demo values | View records |

### 6.3 Insights

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| INS-01 | Present one top insight proactively. | P0 | The page has no empty chat UI and leads with one prioritized headline. |
| INS-02 | Show the evidence behind the insight. | P0 | Sleep change, HRV change, and reaction-time change are visible and derived from the displayed data. |
| INS-03 | Show one restrained 7-day trend. | P0 | HRV values `[49,48,47,45,44,43,42]` render with accessible labels or a data alternative. |
| INS-04 | Explain in four bounded sections. | P0 | Detail contains What changed, What happened alongside it, What this may mean, and Suggested next step. |
| INS-05 | Use cautious language. | P0 | Copy uses “may be related,” “happened alongside,” or equivalent; it does not state diagnosis, treatment, or causation. |
| INS-06 | Convert explanation into action. | P0 | User can add the recommendation to Plan or start the applicable session. Duplicate additions are prevented. |
| INS-07 | Generate deterministic explanations first. | P0 | Rule and input provenance can be inspected; LLM failure does not block a safe template insight. |
| INS-08 | Optionally refine language with structured AI output. | P1 | Output is schema-validated, bounded, safety-checked JSON; malformed output falls back to the deterministic insight. |

### 6.4 Plan and interventions

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| PLAN-01 | Show no more than three priorities. | P0 | Brain Training appears first, followed by Breathing and Sleep Goal. |
| PLAN-02 | Support explicit action states. | P0 | Each action is `pending`, `active`, or `completed`; transitions are valid and visually distinct. |
| PLAN-03 | Run a functioning attention task. | P0 | The session captures duration, reaction time, accuracy, missed responses, completion status, and comparison with baseline. |
| PLAN-04 | Save a completed brain-training session. | P0 | Save is idempotent; the session appears in history and updates Plan/Home progress once. |
| PLAN-05 | Run a guided breathing session. | P0 | Inhale 4 s, hold 2 s, exhale 6 s; user can pause or finish and provide Better/Same/Worse feedback. |
| PLAN-06 | Support interruption and recovery. | P0 | Accidental navigation prompts the user; abandoned sessions are not reported as completed; retry does not duplicate results. |
| PLAN-07 | Provide a sleep goal. | P0 | User can set or confirm an in-bed target such as 22:30; simulated reminders are labelled accordingly. |
| PLAN-08 | Show daily completion progress. | P0 | “2 of 3 complete” always matches stored action state. |
| PLAN-09 | Offer consultation without overbuilding scheduling. | P1 | A modal presents description, demo slots, and contact option; simulated slots are clearly labelled. |

### 6.5 Profile and onboarding

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| PROF-01 | Group data sources into three categories. | P0 | Profile exposes Devices, Assessments & Tests, and Records, with Settings below. |
| PROF-02 | Explain source status. | P0 | Apple Watch, smart ring, upload, record, and assessment entries show Connected, Demo, Simulated, Not connected, or dated status accurately. |
| PROF-03 | Keep settings minimal. | P1 | Name, age, units, privacy, and sign-out are available; unrelated settings are absent. |
| ONB-01 | Complete onboarding in under two minutes. | P1 | User can choose improvement goals, enter a short sleep baseline, start/skip brain assessment, connect/skip wearable, and enter Home. |
| ONB-02 | Default competition mode to Alex. | P0 | “Continue as Alex” creates or restores the consistent demo state without normal authentication. |
| ONB-03 | Keep all onboarding paths recoverable. | P1 | Back, skip, validation, refresh, and resume behavior do not lose accepted answers or trap the user. |

---

## 7. Canonical Demo Data and Rules

### 7.1 Demo baseline

| Domain | Baseline/current value |
|---|---|
| User | Alex, 35, ID `demo_001` |
| Sleep | Baseline 7h 10m; current 6h 18m; quality 61 |
| HRV | Baseline 48 ms; current 42 ms |
| Heart rate | 72 bpm |
| SpO₂ | 98% |
| Respiratory rate | 14/min |
| Stress | 7/10 |
| Brain | Attention 78; memory 82; reaction 312 ms; baseline reaction 291 ms |
| Muscle recovery | 73/100 |
| Gut | Stable |
| Labs | ALT normal; AST normal; glucose normal |

Seven-day arrays:

```json
{
  "sleep": [7.33, 7.08, 6.92, 6.67, 6.53, 6.33, 6.3],
  "hrv": [49, 48, 47, 45, 44, 43, 42],
  "heartRate": [68, 69, 70, 70, 71, 72, 72],
  "stress": [4, 5, 5, 6, 6, 7, 7],
  "reactionTime": [291, 294, 298, 301, 305, 309, 312]
}
```

### 7.2 Explainable rules

1. If sleep duration falls more than 10% and HRV falls more than 10%, set recovery status to Attention.
2. If stress is 7 or higher and HRV is below baseline, recommend a regulation session.
3. If reaction time is more than 5% slower than baseline while sleep duration is below baseline, mention a possible cognitive-performance relationship.
4. Rules shall use one canonical calculation method and include the comparison window.
5. A missing or stale input shall produce No Data or a qualified result, not a fabricated observation.

### 7.3 Status vocabulary

Only these user-facing statuses are allowed in the MVP:

- `good` — green
- `attention` — amber
- `no_data` — neutral gray
- `completed` — cyan/blue, for action completion only

No clinical risk score is implied.

---

## 8. AI Requirements and Safety

### 8.1 AI role

AI may refine an already-computed, evidence-backed observation into short plain language. AI shall not independently diagnose, invent measurements, or choose high-risk actions.

Required validated output:

```json
{
  "headline": "",
  "whatChanged": "",
  "possibleRelationship": "",
  "nextAction": "",
  "actionType": ""
}
```

### 8.2 Safety requirements

| ID | Requirement |
|---|---|
| SAFE-01 | Every relevant surface states that SleepOS provides wellness information and does not replace professional advice or diagnosis. |
| SAFE-02 | The system shall not diagnose sleep disorders, claim to treat insomnia, recommend prescription medication, or advise stopping medication. |
| SAFE-03 | Correlations shall use uncertainty language and expose the metrics behind them. |
| SAFE-04 | Potentially concerning breathing or other patterns shall recommend professional assessment without alarmist presentation. |
| SAFE-05 | Emergency or severe-symptom language, if entered in future free text, shall not be handled as ordinary wellness advice. |
| SAFE-06 | Demo health data shall be synthetic and visually identified as demo data where confusion is possible. |
| SAFE-07 | AI prompts, outputs, failures, and selected rule identifiers shall be observable without logging secrets or unnecessary health data. |

Default footer:

> SleepOS provides wellness information and does not replace professional medical advice or diagnosis.

---

## 9. Privacy, Security, and Data Governance

1. Collect only data required for the defined MVP loop.
2. Separate demo identities/data from real accounts and production health data.
3. Require authorization and ownership checks for every user-scoped read and write.
4. Use server-side validation; client validation is for usability only.
5. Apply row-level security if Supabase is used; the client shall not receive service-role credentials.
6. Treat assessment results, metrics, records, and session feedback as sensitive wellness data.
7. Encrypt traffic and use managed encryption at rest.
8. Define retention, export, correction, and deletion behavior before accepting real pilot data.
9. Never log raw records, authentication tokens, full AI prompts containing sensitive data, or unnecessary identifiers.
10. Validate uploads by type, size, content, and ownership before any real records feature is enabled.
11. Rate-limit authentication, AI generation, uploads, and session writes.
12. Record consent and policy version before enabling real external data connections.
13. Complete a threat model and privacy review before pilot use; a competition demo does not constitute pilot approval.

---

## 10. Technical Product Constraints

### 10.1 Recommended application shape

1. Next.js and React for the application shell and routes.
2. Three.js and GSAP retained for the supplied human.
3. CSS modules or Tailwind for the design system.
4. Recharts, Chart.js, or an equivalent accessible lightweight chart for the single trend.
5. Supabase for optional MVP persistence, authentication, and database only after contracts and security rules are defined.
6. Shared runtime schemas for API inputs, outputs, database boundaries, and AI output.

The final stack is confirmed at the Phase 0 architecture gate; this PRD does not authorize bypassing architecture decisions.

### 10.2 Conceptual data entities

The canonical schema shall support:

1. User/profile
2. Daily metrics and data provenance
3. Brain assessments
4. Questionnaires
5. Training sessions
6. Daily plan and actions
7. Insights and rule provenance
8. Connected sources
9. Records metadata
10. User feedback/consultation interest

All entity and field names must be finalized in `DATABASE_SCHEMA.md` and `SHARED_KEYS.md` before implementation.

### 10.3 Required state coverage

Each feature shall define and test relevant initial, loading, empty, no-data, success, active, completed, validation, permission, not-found, conflict, offline/network, dependency failure, timeout, cancellation, retry, and recovery states.

---

## 11. Visual and Interaction Specification

### 11.1 Visual language

| Token | Value |
|---|---|
| Background | `#020B18` |
| Surface | `#071426` |
| Border | `rgba(150, 190, 230, 0.15)` |
| Primary cyan | `#63C8FF` |
| Secondary purple | `#9A78FF` |
| Good | `#67D391` |
| Attention | `#F5A94D` |
| Primary text | `#F1F5F9` |
| Secondary text | `#8FA6BA` |

1. Use one modern sans-serif family and no more than four weights.
2. Use 20 px mobile page padding, 16–20 px card radius, and 16/24/32 px vertical rhythm.
3. Target a 72 px mobile bottom navigation.
4. Reserve glow primarily for the anatomy and selected states.
5. Avoid excessive particles, giant HUD graphics, aggressive neon, and dense medical dashboards.
6. Meet WCAG 2.2 AA for ordinary text, controls, focus, keyboard operation, target size, and reduced motion where feasible for the MVP.

---

## 12. Analytics and Success Metrics

### 12.1 Canonical events

| Funnel | Events |
|---|---|
| Acquisition | `onboarding_started`, `onboarding_completed` |
| Engagement | `home_viewed`, `explore_viewed`, `system_selected`, `insight_viewed`, `plan_viewed` |
| Training | `brain_training_started`, `brain_training_completed`, `breathing_started`, `breathing_completed` |
| Conversion | `assessment_started`, `assessment_completed`, `consultation_clicked` |
| Retention | `day_1_return`, `day_7_return`, `weekly_active_user` |

Event payloads, consent behavior, and privacy limits shall be defined in `SHARED_KEYS.md` before instrumentation.

### 12.2 Pilot targets

1. Activation: at least 70% of onboarded pilot users complete a baseline assessment.
2. Engagement: at least 60% complete one recommended action.
3. Adherence: average at least two brain-training sessions per week.
4. Insight usefulness: at least 70% rate the weekly insight useful.
5. Retention: at least 40% are active in Week 4.

These are evaluation targets, not promised outcomes or validated benchmarks.

---

## 13. Phase-Wise Delivery Plan

### Phase 0 — Requirements, contracts, and safety foundation

**Objective:** make product scope and implementation contracts stable before feature work.

Point-by-point deliverables:

1. Approve this PRD and assign product owner.
2. Confirm competition-demo versus real-pilot data boundary.
3. Inspect, license, checksum/version, and approve the supplied HTML and remote GLB assets.
4. Decide Next.js/React application architecture and 3D component boundary.
5. Define canonical domain keys, statuses, units, timestamps, data-source labels, and analytics events.
6. Define database entities, ownership, retention, row-level security, migrations, and rollback.
7. Define API and AI schemas, error envelopes, idempotency, and authorization.
8. Document primary data flow, trust boundaries, model-loading fallback, and session state transitions.
9. Create safety copy, escalation logic, demo labelling, and privacy baseline.
10. Convert this PRD into independently testable task acceptance criteria.

Exit gate:

- PRD is approved and independently reviewed.
- No unresolved P0 product ambiguity remains.
- Architecture, API, database, shared keys, safety rules, and 3D asset provenance are documented.
- Demo data is canonical and internally consistent.

### Phase 1 — Application shell and trustworthy demo foundation

**Objective:** deliver a coherent, responsive product shell with one consistent demo state.

Point-by-point deliverables:

1. Build the five-destination mobile navigation and responsive desktop shell.
2. Implement design tokens, typography, surfaces, status components, loading/error patterns, and accessibility foundations.
3. Implement demo mode and canonical Alex data provider.
4. Build Home with greeting, three metrics, one status, and one recommendation.
5. Build Profile source categories and explicitly labelled demo states.
6. Add wellness disclaimer and safety/escalation surfaces.
7. Add basic event instrumentation without sensitive payloads.
8. Verify mobile 390 × 844 and agreed desktop reference sizes.

Exit gate:

- Home answers its question in under five seconds during usability review.
- Navigation, responsive layout, keyboard focus, loading, empty, and error states pass focused QA.
- All visible metrics come from the same demo object.
- No device, record, or integration is misrepresented as live.

### Phase 2 — Explore and insight explanation

**Objective:** integrate the supplied human and connect body context to a cautious, actionable explanation.

Point-by-point deliverables:

1. Integrate the supplied BodyParts3D human as an isolated Explore component.
2. Preserve skin, organ rendering, labels, rotation, tilt, zoom, reset, layer controls, focus animation, and selection.
3. Add model loading progress, timeout, retry, WebGL fallback, reduced motion, cleanup, and static system-selector fallback.
4. Connect Brain, Heart, Lungs, and Gut verified layers to canonical system detail sheets.
5. Add labelled region overlays for Muscle and Metabolic until verified geometry exists.
6. Connect detail actions to Insights, Plan, breathing, training, assessments, recovery, and records.
7. Implement deterministic insight rules and one top Insight.
8. Implement the 7-day HRV trend and four-section explanation.
9. Allow a recommendation to be added to Plan once.
10. Measure and optimize mobile load time, bundle impact, memory cleanup, and FPS.

Exit gate:

- The supplied human—not a substitute—works across supported desktop and mobile browsers.
- All systems are reachable without relying solely on the 3D canvas.
- A GLB/network/WebGL failure still leaves Explore usable.
- Insight calculations match the canonical data and never assert diagnosis or causation.
- Target device sustains at least 30 FPS during ordinary manipulation.

### Phase 3 — Plan, brain training, breathing, and closed loop

**Objective:** make the core intervention loop functional and visibly measurable.

Point-by-point deliverables:

1. Build Plan with Brain Training, Breathing, and Sleep Goal in that order.
2. Implement pending, active, completed, abandoned, and retry behavior.
3. Build the working attention task with reaction time, accuracy, misses, duration, and baseline comparison.
4. Build breathing with 4/2/6 timing, pause, finish, and Better/Same/Worse feedback.
5. Make save operations idempotent and interruption-safe.
6. Update Plan count, Home progress, and session history from one completion event.
7. Add restart/resume policy and duplicate-write protection.
8. Add the simulated consultation modal if P0 work is stable.
9. Validate the full competition demo path within 60–90 seconds.

Exit gate:

- The complete core flow runs without manual data edits.
- Training results are calculated correctly and stored once.
- Completion state remains consistent across Plan, Home, and history after navigation and refresh where persistence is enabled.
- Failed or abandoned sessions never appear completed.

### Phase 4 — Persistence, assessment, onboarding, and bounded AI

**Objective:** move from a coherent demo to a pilot-ready product foundation without weakening safety.

Point-by-point deliverables:

1. Implement Supabase schema and migrations only after Phase 0 contract approval.
2. Implement demo authentication first; add optional real auth only if needed.
3. Apply ownership checks and row-level security to all user-scoped entities.
4. Persist plans, training sessions, feedback, assessments, and daily metrics.
5. Build sub-two-minute onboarding and baseline questionnaire/assessment flow.
6. Add structured AI wording refinement behind deterministic rules and schema validation.
7. Implement bounded timeout, fallback, observability, rate limits, and privacy-safe AI logging.
8. Add consultation and simulated upload state if still required.
9. Define export/deletion and consent behavior before any real pilot data is entered.

Exit gate:

- Persistence, authorization, retry, duplicate, and deletion tests pass.
- AI failure or invalid output falls back safely and cannot block an insight.
- Onboarding completes within two minutes in representative testing.
- A privacy/security reviewer approves the real-data boundary.

### Phase 5 — Integrated QA, security, performance, and release

**Objective:** prove the complete release story and document remaining limitations.

Point-by-point deliverables:

1. Run end-to-end tests for onboarding/demo login through updated post-training status.
2. Test supported browsers, 390 × 844 mobile layout, desktop layout, touch, mouse, keyboard, reduced motion, and screen-reader essentials.
3. Test 3D slow load, asset 404/CORS, WebGL unavailable, context loss, route remount, memory cleanup, and low-performance fallback.
4. Test malformed inputs, authorization failures, cross-user access, duplicate submissions, refresh, offline/network failure, timeout, and recovery.
5. Run privacy, security, accessibility, AI-safety, dependency, and upload reviews applicable to enabled scope.
6. Verify analytics accuracy and absence of sensitive payloads.
7. Record performance budgets and verify Home critical path is not blocked by the 3D bundle.
8. Rehearse the 60–90 second competition demo and a clean first-run deployment.
9. Document environment variables, migrations, deployment, rollback, monitoring, known limitations, and support ownership.
10. Obtain independent release sign-off.

Exit gate:

- No unresolved P0 defect or safety/security blocker remains.
- Critical end-to-end, API, data, accessibility, and fallback tests pass.
- Deployment and rollback are verified, not merely documented.
- Asset provenance and controlled hosting are resolved.
- Demo-ready and pilot-ready claims are reported separately.

---

## 14. Priority and Release Boundary

### P0 — Required for competition MVP

1. Five-item navigation and responsive shell.
2. Home status and recommendation.
3. Explore using the supplied 3D human.
4. System selection and data detail sheets.
5. Deterministic Insight and trend.
6. Three-action Plan.
7. Working brain-training task.
8. Working breathing exercise.
9. Completion updates across the product.
10. Profile source transparency.
11. Demo data, safety copy, accessibility essentials, and failure states.
12. Full 60–90 second demo flow.

### P1 — Required for pilot-ready foundation

1. Supabase persistence and real-data security controls.
2. Baseline assessment and questionnaire.
3. Sub-two-minute onboarding.
4. Optional structured AI wording refinement.
5. Consultation modal.
6. Real completion persistence across sessions.
7. Consent, retention, deletion, and privacy controls.

### P2 — Post-MVP candidates

1. Real wearable connections.
2. Real scheduling and notifications.
3. PDF reports.
4. Microbiome, hospital, TCM, and nutrition integrations.
5. Practitioner or multi-user dashboard.

P2 work shall not delay P0 validation.

---

## 15. End-to-End Acceptance Scenario

1. Alex enters demo mode and lands on Home.
2. Home shows sleep 6h 18m, HRV 42 ms, reaction 312 ms, Attention status, and one recommendation.
3. Alex opens Explore; the supplied BodyParts3D human loads with smooth transparent skin.
4. Alex rotates and zooms the human, selects Brain, and sees the brain metrics.
5. Alex selects Heart and sees HRV context.
6. Alex opens the top Insight and sees sleep, HRV, stress, and reaction changes described as associated—not causal.
7. Alex adds the recommendation to Plan without creating a duplicate.
8. Plan shows at most three priorities with Brain Training first.
9. Alex completes the attention task and receives reaction time, accuracy, misses, duration, and baseline comparison.
10. Alex saves once and returns to Plan/Home.
11. The action is completed, daily progress is updated, and session history contains one new record.
12. If the 3D assets or AI are unavailable, the same core journey remains possible through defined fallbacks.

---

## 16. Open Decisions and Risks

| ID | Decision or risk | Required resolution | Blocking phase |
|---|---|---|---|
| O-01 | Product owner and independent reviewer are unassigned. | Assign accountable people/agents and approval method. | Phase 0 gate |
| O-02 | Competition demo versus real pilot is not formally selected. | Define release claim and allowed data class. | Phase 0 gate |
| O-03 | GLB ownership, licensing, availability, and version control are unverified. | Record provenance and approve controlled hosting. | Phase 2 release |
| O-04 | Muscle and metabolic geometry are absent from the supplied implementation. | Approve labelled regional overlays or supply verified meshes. | Phase 2 |
| O-05 | Reference mobile device and supported browser matrix are unset. | Define measurable performance/compatibility targets. | Phase 1 gate |
| O-06 | Brain-training task protocol is only a demonstration. | Approve stimuli, timing, scoring, baseline comparison, and disclaimer. | Phase 3 |
| O-07 | Clinical escalation thresholds are not defined. | Obtain appropriate safety review before real data use. | Pilot release |
| O-08 | Supabase region, environment topology, and retention policy are unset. | Decide before database implementation or pilot data. | Phase 4 |
| O-09 | Analytics provider and consent model are unset. | Select provider or keep local/no-op instrumentation. | Phase 1/4 |
| O-10 | Success targets are hypotheses. | Define pilot sample, measurement windows, and analysis plan. | Pilot launch |

---

## 17. Definition of Done

A requirement is done only when:

1. Its acceptance criteria pass.
2. Relevant normal, boundary, failure, retry, permission, and recovery paths are tested.
3. User-visible behavior matches this PRD and canonical contracts.
4. Data, API, schema, shared keys, analytics, and documentation remain synchronized.
5. Health copy and AI behavior pass the applicable safety review.
6. Accessibility and responsive behavior are verified for the affected flow.
7. The supplied 3D asset's behavior and fallbacks are verified where applicable.
8. Another reviewer signs off; the implementer does not approve their own work.

The product release is done only when the Phase 5 gate passes and the team states clearly whether the result is demo-ready, pilot-ready, or production-ready.
