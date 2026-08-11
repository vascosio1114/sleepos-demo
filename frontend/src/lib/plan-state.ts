export type PlanActionId = "brain_training" | "breathing" | "sleep_goal";
export type PlanActionStatus = "pending" | "active" | "completed";

export interface PlanAction {
  id: PlanActionId;
  title: string;
  purpose: string;
  duration: string;
  status: PlanActionStatus;
}

export interface BrainTrainingResult {
  id: string;
  type: "brain_training";
  reactionTime: number | null;
  accuracy: number;
  missedResponses: number;
  completedTrialCount: number;
  baselineComparisonPercent: number | null;
  durationSeconds: number;
  completedAt: string;
}

export interface BreathingResult {
  id: string;
  type: "breathing";
  feedback: "better" | "same" | "worse";
  durationSeconds: number;
  completedAt: string;
}

export type SessionResult = BrainTrainingResult | BreathingResult;

export interface PlanState {
  actions: PlanAction[];
  sessions: SessionResult[];
  breathingFeedback: "better" | "same" | "worse" | null;
  sleepGoal: string;
}

export type PlanEvent =
  | { type: "start"; id: PlanActionId }
  | { type: "complete"; id: PlanActionId }
  | { type: "abandon"; id: PlanActionId }
  | { type: "save_training"; result: BrainTrainingResult }
  | { type: "save_breathing"; result: BreathingResult }
  | { type: "set_sleep_goal"; target: string }
  | { type: "reset_demo" };

export function createInitialPlanState(): PlanState {
  return {
    actions: [
      { id: "brain_training", title: "Brain Training", purpose: "Attention & regulation", duration: "10 min", status: "pending" },
      { id: "breathing", title: "Breathing", purpose: "Support relaxation", duration: "5 min", status: "pending" },
      { id: "sleep_goal", title: "Sleep Goal", purpose: "In bed by 10:30 PM", duration: "Tonight", status: "pending" },
    ],
    sessions: [],
    breathingFeedback: null,
    sleepGoal: "22:30",
  };
}

function updateAction(state: PlanState, id: PlanActionId, status: PlanActionStatus): PlanState {
  return {
    ...state,
    actions: state.actions.map((action) => action.id === id ? { ...action, status } : action),
  };
}

export function planReducer(state: PlanState, event: PlanEvent): PlanState {
  switch (event.type) {
    case "start":
      return updateAction(state, event.id, "active");
    case "complete":
      return updateAction(state, event.id, "completed");
    case "abandon":
      return updateAction(state, event.id, "pending");
    case "save_training": {
      if (state.sessions.some((session) => session.id === event.result.id)) return state;
      const completed = updateAction(state, "brain_training", "completed");
      return { ...completed, sessions: [...completed.sessions, event.result] };
    }
    case "save_breathing": {
      if (state.sessions.some((session) => session.id === event.result.id)) return state;
      const completed = updateAction(state, "breathing", "completed");
      return { ...completed, sessions: [...completed.sessions, event.result], breathingFeedback: event.result.feedback };
    }
    case "set_sleep_goal":
      return { ...updateAction(state, "sleep_goal", "completed"), sleepGoal: event.target };
    case "reset_demo":
      return createInitialPlanState();
  }
}

export function completedActionCount(state: PlanState) {
  return state.actions.filter((action) => action.status === "completed").length;
}
