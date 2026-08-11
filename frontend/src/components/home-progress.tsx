"use client";

import { completedActionCount } from "@/lib/plan-state";
import { usePlan } from "./plan-provider";

export function HomeProgress() {
  const { state, isHydrated, storageNotice } = usePlan();
  const completed = isHydrated ? completedActionCount(state) : 0;
  return (
    <div className="progress-quiet" aria-live="polite" title={storageNotice ?? undefined} aria-label={`${completed} of ${state.actions.length} daily actions complete${storageNotice ? `. ${storageNotice}` : ""}`}>
      <strong>{completed}/{state.actions.length}</strong>
      <span>daily actions</span>
    </div>
  );
}
