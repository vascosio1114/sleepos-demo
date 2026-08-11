"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createInitialPlanState, planReducer, type PlanEvent, type PlanState } from "@/lib/plan-state";

const STORAGE_KEY = "sleepos.demo.v1";
const PlanContext = createContext<{ state: PlanState; dispatch: React.Dispatch<PlanEvent>; isHydrated: boolean; storageNotice: string | null } | null>(null);

interface DemoSnapshot {
  version: 1;
  plan: PlanState;
}

function isStoredPlan(value: unknown): value is DemoSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<DemoSnapshot>;
  if (snapshot.version !== 1 || !snapshot.plan || !Array.isArray(snapshot.plan.actions) || !Array.isArray(snapshot.plan.sessions)) return false;
  const allowedIds = new Set(["brain_training", "breathing", "sleep_goal"]);
  const allowedStatuses = new Set(["pending", "active", "completed"]);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isIntegerInRange = (candidate: unknown, minimum: number, maximum: number) => Number.isInteger(candidate) && Number(candidate) >= minimum && Number(candidate) <= maximum;
  const ids = snapshot.plan.actions.map((action) => action.id);
  const feedback = snapshot.plan.breathingFeedback;
  const validSessions = snapshot.plan.sessions.every((session) => {
    if (!session || typeof session.id !== "string" || !uuid.test(session.id) || !isIntegerInRange(session.durationSeconds, 1, 7200) || typeof session.completedAt !== "string" || !Number.isFinite(Date.parse(session.completedAt))) return false;
    if (session.type === "brain_training") {
      const validReaction = session.reactionTime === null || isIntegerInRange(session.reactionTime, 50, 5000);
      const validComparison = session.baselineComparisonPercent === null || isIntegerInRange(session.baselineComparisonPercent, -100, 2000);
      return validReaction && validComparison && isIntegerInRange(session.accuracy, 0, 100) && isIntegerInRange(session.completedTrialCount, 0, 5) && isIntegerInRange(session.missedResponses, 0, 500);
    }
    return session.type === "breathing" && ["better", "same", "worse"].includes(session.feedback);
  });
  return snapshot.plan.actions.length === 3
    && new Set(ids).size === 3
    && ids.every((id) => allowedIds.has(id))
    && snapshot.plan.actions.every((action) => allowedStatuses.has(action.status))
    && (feedback === null || ["better", "same", "worse"].includes(feedback))
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(snapshot.plan.sleepGoal)
    && snapshot.plan.sessions.length <= 50
    && validSessions;
}

export function PlanProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(planReducer, undefined, createInitialPlanState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isStoredPlan(parsed)) {
          for (const action of parsed.plan.actions) {
            if (action.status === "completed") dispatch({ type: "complete", id: action.id });
          }
          for (const session of parsed.plan.sessions) {
            dispatch(session.type === "brain_training" ? { type: "save_training", result: session } : { type: "save_breathing", result: session });
          }
          if (parsed.plan.actions.find((action) => action.id === "sleep_goal")?.status === "completed") {
            dispatch({ type: "set_sleep_goal", target: parsed.plan.sleepGoal });
          }
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
          queueMicrotask(() => setStorageNotice("Saved demo progress was invalid and has been reset."));
        }
      }
    } catch {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage can be unavailable */ }
      queueMicrotask(() => setStorageNotice("Demo progress could not be restored. This session starts from the baseline."));
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const snapshot: DemoSnapshot = { version: 1, plan: { ...state, sessions: state.sessions.slice(-50) } };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        queueMicrotask(() => setStorageNotice("Demo progress is available in this tab but could not be saved locally."));
      }
    }
  }, [isHydrated, state]);

  const value = useMemo(() => ({ state, dispatch, isHydrated, storageNotice }), [state, isHydrated, storageNotice]);
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlan must be used inside PlanProvider");
  return context;
}
