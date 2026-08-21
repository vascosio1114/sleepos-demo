import { NextRequest } from "next/server";
import { generateRequestId, success } from "../../_lib/responses";
import { buildSyntheticBrainHistory } from "../../_lib/mock-providers";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = Math.max(1, Math.min(50, Number(limitParam ?? 30) || 30));
  const history = buildSyntheticBrainHistory("demo_001").slice(-limit);
  return success(history, requestId);
}