# SleepOS Current Functions, Tools, and Models

> Status: P0 demo inventory  
> Date: 2026-08-21  
> Scope: Current SleepOS demo capability after the A2A voice / advice / brain stream work.  
> Safety boundary: Wellness guidance only. SleepOS must not diagnose, treat, prescribe medication, or infer medical causes.

## 1. Product Surface

SleepOS currently keeps the five-destination P0 structure and adds voice check-in as an entry flow rather than a sixth main tab.

| Page | Current function | Data mode |
|---|---|---|
| `/` Home | Alex overview, 7-day sleep chart, HRV / reaction trends, `Start voice check-in` CTA, today's suggested action | Mock / deterministic demo data |
| `/check-in` | Voice check-in flow, transcript review, self-report fields, AI advice result, text-to-speech playback | Mock by default; live STT / advice possible when configured |
| `/explore` | BodyParts3D viewer, six system categories, `Body` / `Brain` view switch | Mock 3D model and brain snapshots |
| `/insights` | 7-day chart, explainable insight, latest AI advice run, audio play action | Mock by default; MiniMax advice possible |
| `/plan` | Three-action plan, start / complete cycle, session history | Mock P0 state |
| `/profile` | Profile, source list, settings, voice history, delete / reset controls | Mock plus local voice-session history |
| `/onboarding` | Six-stage onboarding wizard from goals to ready state | Mock P0 state |

## 2. Core Systems

| System | Role | Location |
|---|---|---|
| Safety router | Classifies check-ins into green / amber / red routes using reason codes and deterministic rules | `frontend/src/lib/voice-advice/safety.ts` |
| Deterministic scoring | Produces brain-domain demo scores for attention, regulation, memory, and sleep / arousal | `frontend/src/lib/voice-advice/` |
| Local storage | Versioned browser storage for voice sessions, check-ins, advice runs, brain snapshots, plan, and onboarding | `frontend/src/lib/voice-advice/store.ts` and existing demo stores |
| Provider factory | Chooses mock or live providers from environment configuration | `frontend/src/lib/voice-advice/providers/index.ts` |
| Output validator | Enforces action enums, routine keys, length limits, risk level, and prohibited phrases | `frontend/src/lib/voice-advice/safety.ts` |
| Idempotent API writes | Adds idempotency keys to write calls so duplicate saves do not corrupt demo state | `frontend/src/lib/voice-advice/api.ts` |

## 3. Voice Check-In Flow

| Stage | Current behavior |
|---|---|
| Intro | Shows wellness scope before recording or scenario selection |
| Scenario select | Includes demo cases across ordinary, ambiguous, diagnosis, medication, crisis, prompt-injection, ASR, and no-data categories |
| Record | Uses browser microphone capture, MediaRecorder, waveform display, and PCM conversion |
| Transcription | Uses mock transcript by default; can use Google STT when live mode is configured |
| Transcript review | Flags low-confidence text and lets the user confirm or edit before analysis |
| Check-in fields | Captures sleep quality, sleep minutes, stress, mood, and focus |
| Advice | Shows summary, observations, bounded advice items, safety routing, and speakable text |
| Insights | Latest advice run appears in the Insights screen |
| Profile | Recent voice sessions can be reviewed and reset |

## 4. Tools And Libraries

| Tool | Purpose |
|---|---|
| Next.js 16 / React 19 | App framework and routing |
| TypeScript | Strict typing for UI, provider contracts, and local schemas |
| Vitest | Unit and contract tests |
| Testing Library + happy-dom | Component tests |
| ESLint | Static code checks |
| Phosphor Icons | UI icon system already used by the app |
| Three.js / GSAP | Explore 3D viewer and motion |
| BodyParts3D GLB assets | Human body and layer models for Explore |
| LocalStorage | Demo persistence |
| Browser SpeechSynthesis | Keyless TTS fallback |
| MediaRecorder / AudioContext | Browser audio capture and PCM conversion |

## 5. Live Providers

Live mode is environment-driven. Mock mode remains the default so the demo can run without external keys.

| Provider | Configured model / service | Purpose | Current status |
|---|---|---|---|
| MiniMax text | `MINIMAX_TEXT_MODEL` | Structured wellness advice generation | Wired through provider factory and guarded by validator |
| MiniMax TTS | `MINIMAX_TTS_MODEL` + `MINIMAX_TTS_VOICE` | Audio response generation | Wired, with browser TTS fallback |
| Google Speech-to-Text | `SLEEPOS_STT_PROVIDER=google_stt_v2` | English audio to transcript | Wired through server-side provider |
| Browser SpeechSynthesis | System voice | Demo audio playback fallback | Working without API key |
| Browser MediaRecorder | Browser-native recording | Audio capture | Working in the client flow |

Required environment keys are documented in `frontend/.env.example` and `docs/SHARED_KEYS.md`. Do not place API key fragments, service account JSON, or local credential paths in committed documentation.

## 6. Data Shape

| Storage key | Purpose | Retention in demo |
|---|---|---|
| `sleepos.voice.v1` | Voice sessions and transcript metadata | Bounded recent history |
| `sleepos.checkins.v1` | Confirmed health check-ins | Bounded recent history |
| `sleepos.advice.v1` | Advice runs and speakable text | Bounded recent history |
| `sleepos.brain-scores.v1` | Brain-domain snapshots | Bounded recent history |
| `sleepos.demo.v1` | Plan and intervention loop state | Bounded demo state |
| `sleepos.onboarding.v1` | Onboarding draft | Single draft |

## 7. Safety Contract

| Layer | Required behavior |
|---|---|
| Pattern matching | Detect crisis, medical emergency, diagnosis, medication, sustained decline, prompt injection, ASR ambiguity, and no-data cases |
| Sustained decline | Use deterministic heuristics before AI advice |
| MiniMax prompt | Keep the model inside the approved JSON schema and action allowlist |
| Validator | Reject invalid action type, invalid routine key, unsafe wording, or oversized output |
| Red routing | Do not call the model for red cases; return deterministic escalation copy |
| Audio retention | Default to no raw audio retention unless future consent and privacy review explicitly allow it |

## 8. Evaluation And Test Coverage

| Area | Current status |
|---|---|
| Safety cases | 47 cases across 8 categories |
| Unit and contract tests | Reported current suite: 70 / 70 passing |
| Component tests | Check-in intro, scenario list, transcript stage, and disclaimer coverage |
| Live eval | MiniMax live runner exists and uses a soft pass threshold |
| Manual QA | Manual checklist exists in `docs/development/MANUAL_TEST.md` |

Before using this for a pilot, rerun lint, typecheck, tests, build, and live-provider smoke tests in the current environment.

## 9. Canonical Documentation

| Document | Purpose |
|---|---|
| `docs/A2A_VOICE_BRAIN_INTEGRATION_PLAN.md` | Main integration plan and architecture |
| `docs/SHARED_KEYS.md` | Environment and storage key registry |
| `docs/decisions/ADR-002_Voice_Advice_Provider_Boundary.md` | Provider boundary decision |
| `docs/decisions/ADR-003_Real_Provider_Integration.md` | Real-provider override policy |
| `docs/tasks/10_Voice_Advice_Contracts.md` | Voice / advice contracts |
| `docs/tasks/11_Voice_Advice_Implementation.md` | Mock implementation task |
| `docs/tasks/14_Brain_Visualization.md` | Brain visualization task |
| `docs/development/MANUAL_TEST.md` | Manual QA checklist |
| `docs/knowledge/approved/*.md` | Approved-under-override knowledge content |

## 10. Remaining Gates

| Gate | Status |
|---|---|
| Independent review of Tasks 10, 11, and 14 | Pending |
| Clinical / wellness review of scope and escalation copy | Pending |
| Legal review of emergency / hotline wording | Pending |
| Privacy / security review of no-raw-audio and secret handling | Pending |
| Knowledge review and promotion beyond demo-approved status | Pending |
| Real-data pilot readiness: auth, database, RLS, consent, export, delete, monitoring | Not implemented |

## 11. Practical Summary

SleepOS now has a runnable end-to-end P0 demo path:

```text
English voice input
  -> transcript review
  -> self-report check-in
  -> safety routing
  -> deterministic scoring
  -> MiniMax-compatible advice pipeline
  -> text and audio response
  -> Insights / Plan / Profile / Explore Brain surfaces
```

The next best improvement is not more model training yet. The next best improvement is to complete review gates, wire approved knowledge retrieval into the advice provider, harden live provider tests, and then decide whether fine-tuning is justified after collecting expert-approved English Q&A examples.
