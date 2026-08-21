import { NextRequest } from "next/server";
import { failure, generateRequestId, success } from "../../_lib/responses";
import { synthesizeEscalation } from "../../_lib/safety";
import type { AdviceOutput } from "../../_lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ adviceRunId: string }> }) {
  const requestId = generateRequestId();
  const { adviceRunId } = await params;
  if (!adviceRunId) return failure("VALIDATION_ERROR", "adviceRunId is required.", 400, requestId);

  const placeholder: AdviceOutput = {
    adviceRunId,
    status: "succeeded",
    safetyLevel: "green",
    safetyReasonCodes: ["minor_low_risk_wellness"],
    summary: "Latest advice run",
    observations: [],
    adviceItems: [],
    brainDomains: [],
    sourceIds: [],
    followUpQuestion: null,
    escalation: synthesizeEscalation("green", ["minor_low_risk_wellness"]),
    speakableText: synthesizeEscalation("green", ["minor_low_risk_wellness"]).message,
    provenance: {
      promptVersion: "advice-prompt-mock-v1",
      knowledgeVersion: "kb-en-2026-08-19-draft",
      safetyReasonCodes: ["minor_low_risk_wellness"],
      adviceProviderKey: "mock",
    },
  };

  return success(placeholder, requestId);
}