// MiniMax text advice provider.
// Implements the `AdviceProvider` interface from
// `shared/schemas/provider-types.ts`. Reads `MINIMAX_*` env at call
// time; never persists the key. The result is always wrapped in the
// strict `AdviceOutput` schema; a malformed model response is
// discarded and replaced with a deterministic safe fallback
// (`buildSafeFallbackAdvice`).
//
// SECURITY:
//   - API key read from process.env.MINIMAX_API_KEY only.
//   - Never logged, even redacted form, except via redactConfig().
//   - Bounded timeout via AbortController.
//   - Fail-closed: any schema / safety violation → safe fallback.

import type { AdviceDraft, AdviceProvider, ValidatedAdviceInput } from "../provider-types";
import {
  SAFETY_COPY,
  classifySafety,
  cryptoRandomUUID,
  isProhibited,
  synthesizeEscalation,
  validateAdviceOutput,
} from "../safety";
import { redactConfig, type ProviderConfig } from "../env";

const TEXT_TIMEOUT_MS = 25_000;

interface MiniMaxMessage { role: "system" | "user" | "assistant"; content: string }
interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  max_tokens?: number;
  temperature?: number;
}
interface MiniMaxResponse {
  choices: { message: { role: "assistant"; content: string } }[];
  usage?: { total_tokens?: number };
}

function buildSystemPrompt(): string {
  return [
    "You are SleepOS, a wellness information assistant. You do NOT diagnose, prescribe, or treat medical conditions.",
    "You produce JSON that conforms EXACTLY to the schema below. Do NOT include any text outside the JSON object.",
    "",
    "# Schema (strict)",
    JSON.stringify({
      type: "object",
      required: ["summary", "observations", "adviceItems", "brainDomains", "sourceIds", "followUpQuestion", "escalation", "speakableText"],
      properties: {
        summary: { type: "string", minLength: 1, maxLength: 160 },
        observations: { type: "array", maxItems: 16, items: { type: "object" } },
        adviceItems: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            required: ["title", "reason", "actionType", "routineKey", "durationMinutes", "riskLevel"],
            properties: {
              title: { type: "string", minLength: 1, maxLength: 80 },
              reason: { type: "string", minLength: 1, maxLength: 240 },
              actionType: {
                type: "string",
                enum: ["brain_training", "breathing", "sleep_goal", "routine"],
                description: "MUST be one of these four string values exactly. Any other value (including 'lifestyle', 'mindfulness', 'exercise', 'meditation', 'wellness', 'habit', 'self_care') will be REJECTED. If the user asks for something that does not map cleanly, pick the closest from the four.",
              },
              routineKey: {
                type: ["string", "null"],
                enum: [
                  "consistent_wake_time",
                  "wind_down_30_min_no_screens",
                  "no_caffeine_after_2pm",
                  "morning_daylight_10_min",
                  "regular_meal_times",
                  "hydration_balance",
                  "bedroom_dark_cool_quiet",
                  "short_walk_after_dinner",
                  null,
                ],
                description: "Required ONLY when actionType is 'routine'. Pick the closest from the enum. When actionType is anything other than 'routine', set routineKey to null. Any value outside the enum will be REJECTED.",
              },
              durationMinutes: { type: "integer", minimum: 0, maximum: 60 },
              riskLevel: { type: "string", enum: ["low"], description: "Always 'low'. Any other value is REJECTED." },
            },
          },
        },
        brainDomains: { type: "array", maxItems: 4, items: { type: "object" } },
        sourceIds: { type: "array", items: { type: "string" } },
        followUpQuestion: { type: ["string", "null"] },
        escalation: { type: ["object", "null"] },
        speakableText: { type: "string", minLength: 1, maxLength: 600 },
      },
    }),
    "",
    "# Mapping rules (use these to pick actionType)",
    '- "brain_training" — short attention/regulation task (5-min reaction or focus). durationMinutes 1-15.',
    '- "breathing" — paced 4/2/6 breathing reset. durationMinutes 1-10.',
    '- "sleep_goal" — confirm a sleep target time (e.g. "in bed by 22:30"). durationMinutes 0.',
    '- "routine" — a daily habit (wind-down, no caffeine, etc.). durationMinutes 0. MUST pick routineKey from the enum.',
    "",
    "# Examples (use these patterns)",
    'For "I slept poorly and want to wind down better":',
    '{ "title": "Try a wind-down routine", "reason": "A consistent pre-sleep habit supports recovery.", "actionType": "routine", "routineKey": "wind_down_30_min_no_screens", "durationMinutes": 30, "riskLevel": "low" }',
    "",
    'For "I feel stressed and need to reset":',
    '{ "title": "Try a 3-minute breathing reset", "reason": "Slow breathing is associated with reduced stress.", "actionType": "breathing", "routineKey": null, "durationMinutes": 3, "riskLevel": "low" }',
    "",
    'For "I want to focus better today":',
    '{ "title": "Try a 3-minute attention reset", "reason": "Short attention tasks are associated with improved focus.", "actionType": "brain_training", "routineKey": null, "durationMinutes": 3, "riskLevel": "low" }',
    "",
    'For "I need to be in bed earlier":',
    '{ "title": "Set tonight\'s sleep goal", "reason": "A consistent bedtime supports circadian alignment.", "actionType": "sleep_goal", "routineKey": null, "durationMinutes": 0, "riskLevel": "low" }',
    "",
    "# Hard rules (any violation causes the response to be REJECTED)",
    "- actionType MUST be EXACTLY one of: brain_training | breathing | sleep_goal | routine.",
    "- Any other actionType value, including common synonyms like 'lifestyle', 'mindfulness', 'exercise', 'meditation', 'wellness', 'habit', 'self_care', 'journaling', 'walk', 'stretch' is FORBIDDEN.",
    "- If a user request does not fit the four action types, MAP it to the closest fit. Do NOT invent a new value.",
    "- routineKey MUST be EXACTLY one of the eight enum values, or null. Never invent a new routineKey.",
    "- riskLevel MUST be the string 'low'.",
    "- summary length: 1-160 chars.",
    "- speakableText length: 1-600 chars; must include the wellness disclaimer.",
    "- Use uncertainty language: 'may', 'can', 'is associated with'.",
    "- Never claim a diagnosis, prescribe medication, or recommend stopping medication.",
    "- If safety classification is amber or red, omit adviceItems (set to []) and set escalation.message to the corresponding copy.",
  ].join("\n");
}

function buildUserPrompt(input: ValidatedAdviceInput): string {
  return JSON.stringify({
    safetyClassification: input.safetyClassification,
    checkin: input.checkin,
    observations: input.observations,
    knowledgeChunkIds: input.knowledgeChunkIds,
    language: input.language,
    maxSpeakableChars: input.maxSpeakableTextChars,
  });
}

function safeFallback(input: ValidatedAdviceInput, error?: string): AdviceDraft {
  void error;
  return {
    adviceRunId: cryptoRandomUUID(),
    status: "failed_safe_fallback",
    safetyLevel: input.safetyClassification.level,
    safetyReasonCodes: input.safetyClassification.reasonCodes,
    summary: "Gentle next step",
    observations: [],
    adviceItems: [],
    brainDomains: [],
    sourceIds: [],
    followUpQuestion: null,
    escalation: synthesizeEscalation(input.safetyClassification.level, input.safetyClassification.reasonCodes),
    speakableText: SAFETY_COPY.wellnessScope.text,
    provenance: {
      promptVersion: "advice-prompt-minimax-v1",
      knowledgeVersion: input.knowledgeVersion,
      safetyReasonCodes: input.safetyClassification.reasonCodes,
      adviceProviderKey: "minimax",
    },
  };
}

function tryParseModelJson(text: string): unknown | null {
  // Strip code fences if present.
  const stripped = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export class MiniMaxAdviceProvider implements AdviceProvider {
  readonly providerKey = "minimax" as const;
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async generate(input: ValidatedAdviceInput): Promise<AdviceDraft> {
    const apiKey = this.config.minimax.apiKey;
    const baseUrl = this.config.minimax.baseUrl ?? "https://api.minimaxi.com";
    const model = this.config.minimax.textModel;
    if (!apiKey || !model) {
      return safeFallback(input);
    }

    const body: MiniMaxRequest = {
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(input) },
      ],
      max_tokens: 800,
      temperature: 0.2,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEXT_TIMEOUT_MS);
    try {
      console.log("[MiniMax DEBUG] apiKey length:", apiKey.length, "first 8:", apiKey.slice(0, 8), "all-ASCII:", /^[A-Za-z0-9_=-]+$/.test(apiKey));
      const authHeader = `Bearer ${apiKey}`;
      console.log("[MiniMax DEBUG] auth header length:", authHeader.length, "starts:", authHeader.slice(0, 20), "ends:", authHeader.slice(-10));
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/text/chatcompletion_v2`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      console.log("[MiniMax DEBUG] response status:", response.status);
      if (response.status !== 200) {
        const txt = await response.text().catch(() => "");
        console.log("[MiniMax DEBUG] non-200 body:", txt.slice(0, 300));
      }

      if (!response.ok) {
        return safeFallback(input, `http_${response.status}`);
      }

      const rawText = await response.text();
      console.log("[MiniMax DEBUG] rawText length:", rawText.length, "first 400:", rawText.slice(0, 400));
      let json: MiniMaxResponse;
      try {
        json = JSON.parse(rawText) as MiniMaxResponse;
      } catch {
        console.log("[MiniMax DEBUG] JSON parse failed");
        return safeFallback(input, "json_parse");
      }
      const content = json.choices?.[0]?.message?.content;
      console.log("[MiniMax DEBUG] content length:", content?.length ?? 0, "first 300:", JSON.stringify(content).slice(0, 300));
      if (typeof content !== "string" || content.length === 0) {
        return safeFallback(input, "empty_content");
      }

      const parsed = tryParseModelJson(content) as Record<string, unknown> | null;
      if (parsed === null) {
        return safeFallback(input, "json_parse");
      }

      const safety = classifySafety({
        transcriptText: input.safetyClassification.evidence.map((e) => e.reasonCode).join(" "),
        checkin: input.checkin,
      });
      const draft: AdviceDraft = {
        adviceRunId: cryptoRandomUUID(),
        status: "succeeded",
        safetyLevel: safety.level,
        safetyReasonCodes: [...safety.reasonCodes],
        summary: typeof parsed.summary === "string" ? parsed.summary : "A wellness summary.",
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        adviceItems: Array.isArray(parsed.adviceItems) ? parsed.adviceItems : [],
        brainDomains: Array.isArray(parsed.brainDomains) ? parsed.brainDomains : [],
        sourceIds: Array.isArray(parsed.sourceIds) ? parsed.sourceIds : [],
        followUpQuestion: typeof parsed.followUpQuestion === "string" ? parsed.followUpQuestion : null,
        escalation: (parsed.escalation as AdviceDraft["escalation"]) ?? null,
        speakableText: typeof parsed.speakableText === "string" ? parsed.speakableText : SAFETY_COPY.wellnessScope.text,
        provenance: {
          promptVersion: "advice-prompt-minimax-v1",
          knowledgeVersion: input.knowledgeVersion,
          safetyReasonCodes: [...safety.reasonCodes],
          adviceProviderKey: "minimax",
        },
      };

      const validation = validateAdviceOutput({
        adviceRunId: draft.adviceRunId,
        status: draft.status,
        safetyLevel: draft.safetyLevel,
        safetyReasonCodes: draft.safetyReasonCodes,
        summary: draft.summary,
        observations: draft.observations,
        adviceItems: draft.adviceItems,
        brainDomains: draft.brainDomains,
        sourceIds: draft.sourceIds,
        followUpQuestion: draft.followUpQuestion,
        escalation: draft.escalation,
        speakableText: draft.speakableText,
        provenance: draft.provenance,
      });
      if (!validation.valid) {
        return safeFallback(input, validation.reason);
      }
      // Defense in depth: explicit prohibited-phrase scan on the model output.
      const proseToCheck = [
        draft.summary,
        draft.speakableText,
        ...draft.adviceItems.map((item: { title: string; reason: string }) => `${item.title} ${item.reason}`),
      ];
      for (const text of proseToCheck) {
        if (isProhibited(text)) return safeFallback(input, "prohibited_phrase");
      }
      return draft;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return safeFallback(input, "timeout");
      }
      return safeFallback(input);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Helper for diagnostics.
export function describeMiniMaxConfig(config: ProviderConfig) {
  return redactConfig(config);
}