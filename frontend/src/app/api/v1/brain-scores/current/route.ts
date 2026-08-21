import { generateRequestId, success } from "../../_lib/responses";
import { buildSeedBrainSnapshot } from "../../_lib/safety";

export async function GET() {
  const requestId = generateRequestId();
  const snapshot = buildSeedBrainSnapshot("demo_001");
  return success(snapshot, requestId);
}