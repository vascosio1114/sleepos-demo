# Shared

Cross-layer types, runtime schemas, and constants used by frontend, backend, and tests. This folder is the single source of truth for any name that crosses layers.

## Layout

```text
shared/
  README.md                    — this file
  types/                       — pure type aliases reused across layers
  schemas/                     — runtime contracts (TypeScript + matching JSON Schema)
  constants/                   — enums, allowlists, copy identifiers, env keys
```

## Rules

1. **One term per concept.** Enum names, identifiers, and field names must agree across files and across `docs/SHARED_KEYS.md`.
2. **TS types and JSON Schema files are paired** and authored together. Each entity has both `entity.ts` (compile-time type) and `entity.schema.json` (runtime validation). The JSON Schema is authoritative for any value that crosses a trust boundary (HTTP request, persisted row, provider input/output).
3. **No provider SDK types in `shared/`.** Provider adapters translate between SDK shapes and the shared interfaces declared in `schemas/provider-types.ts`.
4. **Enums are wire-stable.** Wire values are `snake_case` lowercase. Renaming is a breaking change; deprecating requires a new field.
5. **Timestamps are ISO 8601 UTC.** Local dates use `YYYY-MM-DD`; local times use `HH:mm`. See `SHARED_KEYS.md` §2.
6. **No secrets.** `shared/` files are bundled into the frontend; never embed API keys, real patient data, or sensitive sample content.
7. **Add new entries here before or with the implementing PR.** Add the canonical name to `docs/SHARED_KEYS.md` at the same time.

## Files (current)

### `schemas/`

| File | Purpose |
|---|---|
| `provider-types.ts` | `SpeechToTextProvider`, `AdviceProvider`, `TextToSpeechProvider`, `SpeakableAdvice`, `AudioResult`, `ValidatedAdviceInput`, `AdviceDraft`, `SpeechSessionConfig`, `AudioChunk`, `TranscriptResult` |
| `voice-session.ts` / `.schema.json` | One user's voice check-in session lifecycle |
| `transcript-segment.ts` / `.schema.json` | Per-segment transcript with confidence and timestamps |
| `health-checkin.ts` / `.schema.json` | Five self-report fields + free-text optional note |
| `advice-input.ts` / `.schema.json` | Validated input to an advice provider (already safety-classified) |
| `advice-output.ts` / `.schema.json` | Strict runtime schema for AI advice output; validators fail-closed |
| `brain-score-snapshot.ts` / `.schema.json` | Multi-mode functional domain + optional regional scores |
| `knowledge-document.ts` / `.schema.json` | Approved-source metadata with versioning and expiry |
| `safety-classification.ts` / `.schema.json` | Green / Amber / Red routing result with reasons |

### `constants/`

| File | Purpose |
|---|---|
| `safety.ts` | `SafetyLevel`, escalation / wellness scope / prohibited phrase identifiers and English text |
| `action-allowlist.ts` | `AdviceActionType` allowlist, action duration bounds, risk levels |
| `brain-domains.ts` | `BrainDomain` keys, `BrainScoreMode`, `BrainScoreQuality` |
| `voice-languages.ts` | `VoiceLanguage` enum (initial `en-US`) and BCP-47 codes |
| `provider-config-keys.ts` | Environment variable names for provider isolation |

## Adding a new entity

1. Author `schemas/<type>.ts` (TypeScript type with discriminated unions where applicable).
2. Author `schemas/<type>.schema.json` with the same shape. Validate against a hand-built example.
3. Add the corresponding constant to `constants/` if the entity introduces a new enum or identifier.
4. Update `docs/SHARED_KEYS.md` §2–§10.
5. Update `docs/DATABASE_SCHEMA.md` if persistence is involved.
6. Update `docs/API.md` if HTTP transport is involved.
7. Update `docs/tasks/XX_*.md` for the relevant task and `PROGRESS.md`.

## Validation

- Every JSON Schema file is checked into the repo; CI validates that hand-built example payloads satisfy the schema.
- TS types compile under the repo's TypeScript config.
- Cross-trace review: at least one other agent must confirm SHARED_KEYS / DATABASE_SCHEMA / API / shared types agree before Phase 1 implementation begins.