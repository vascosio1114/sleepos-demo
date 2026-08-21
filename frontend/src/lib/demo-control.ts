"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adviceStore, brainStore, checkinStore, notifyVoiceAdviceStoreUpdated, voiceStore } from "./voice-advice";
import type { BrainDomain } from "./voice-advice";

export type DemoMode = "stable" | "live";
export type DemoScriptId = "normal_checkin" | "amber_safety" | "brain_story";

const DEMO_MODE_KEY = "sleepos.demo-control.mode.v1";
const DEMO_SCRIPT_KEY = "sleepos.demo-control.script.v1";
const DEMO_HIGHLIGHT_KEY = "sleepos.demo-control.highlight.v1";
const PLAN_KEY = "sleepos.demo.v1";
const ONBOARDING_KEY = "sleepos.onboarding.v1";
const UPDATED_EVENT = "sleepos-demo-control-updated";

export interface DemoScript {
  id: DemoScriptId;
  title: string;
  scenarioId: string;
  expected: string;
  talkTrack: string;
  nextRoute: string;
  brainFocus: BrainDomain;
}

export const DEMO_SCRIPTS: readonly DemoScript[] = [
  {
    id: "normal_checkin",
    title: "Normal sleep / stress check-in",
    scenarioId: "voice_safe_short_v1",
    expected: "Green advice with breathing and wind-down actions.",
    talkTrack: "Voice captures self-report, confirms the transcript, then gives bounded wellness advice.",
    nextRoute: "/insights",
    brainFocus: "regulation",
  },
  {
    id: "amber_safety",
    title: "Amber safety case",
    scenarioId: "voice_amber_sustained_v1",
    expected: "Amber routing, professional-support copy, and no diagnosis.",
    talkTrack: "SleepOS checks safety before AI advice and keeps qualified people in the loop.",
    nextRoute: "/insights",
    brainFocus: "sleep_arousal",
  },
  {
    id: "brain_story",
    title: "Brain score view after check-in",
    scenarioId: "voice_safe_long_v1",
    expected: "Green advice, then Explore highlights the relevant brain domain.",
    talkTrack: "The story moves from voice to advice to a visual body / brain explanation.",
    nextRoute: "/explore?view=brain",
    brainFocus: "attention",
  },
];

export function getDemoScript(id: DemoScriptId | null): DemoScript | null {
  return DEMO_SCRIPTS.find((script) => script.id === id) ?? null;
}

function readMode(): DemoMode {
  if (typeof window === "undefined") return "stable";
  return window.localStorage.getItem(DEMO_MODE_KEY) === "live" ? "live" : "stable";
}

function readScript(): DemoScriptId {
  if (typeof window === "undefined") return "normal_checkin";
  const value = window.localStorage.getItem(DEMO_SCRIPT_KEY);
  return DEMO_SCRIPTS.some((script) => script.id === value) ? value as DemoScriptId : "normal_checkin";
}

function readHighlight(): BrainDomain | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(DEMO_HIGHLIGHT_KEY);
  return value === "attention" || value === "regulation" || value === "memory" || value === "sleep_arousal" ? value : null;
}

function notifyDemoControlUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function setDemoMode(mode: DemoMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_KEY, mode);
  notifyDemoControlUpdated();
}

export function setActiveDemoScript(scriptId: DemoScriptId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_SCRIPT_KEY, scriptId);
  const script = getDemoScript(scriptId);
  if (script) window.localStorage.setItem(DEMO_HIGHLIGHT_KEY, script.brainFocus);
  notifyDemoControlUpdated();
}

export function setDemoBrainHighlight(domain: BrainDomain | null) {
  if (typeof window === "undefined") return;
  if (domain) window.localStorage.setItem(DEMO_HIGHLIGHT_KEY, domain);
  else window.localStorage.removeItem(DEMO_HIGHLIGHT_KEY);
  notifyDemoControlUpdated();
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  voiceStore.clearAll();
  checkinStore.clearAll();
  adviceStore.clearAll();
  brainStore.clearAll();
  window.localStorage.removeItem(PLAN_KEY);
  window.localStorage.removeItem(ONBOARDING_KEY);
  setDemoBrainHighlight(null);
  notifyVoiceAdviceStoreUpdated();
  notifyDemoControlUpdated();
}

export function useDemoControl() {
  const [mode, setModeState] = useState<DemoMode>(readMode);
  const [activeScriptId, setActiveScriptIdState] = useState<DemoScriptId>(readScript);
  const [highlightDomain, setHighlightDomainState] = useState<BrainDomain | null>(readHighlight);

  const refresh = useCallback(() => {
    setModeState(readMode());
    setActiveScriptIdState(readScript());
    setHighlightDomainState(readHighlight());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener(UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const setMode = useCallback((next: DemoMode) => {
    setDemoMode(next);
    refresh();
  }, [refresh]);

  const setScript = useCallback((next: DemoScriptId) => {
    setActiveDemoScript(next);
    refresh();
  }, [refresh]);

  const setHighlight = useCallback((domain: BrainDomain | null) => {
    setDemoBrainHighlight(domain);
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    mode,
    activeScriptId,
    activeScript: getDemoScript(activeScriptId),
    highlightDomain,
    setMode,
    setScript,
    setHighlight,
    resetDemoData,
  }), [activeScriptId, highlightDomain, mode, setHighlight, setMode, setScript]);
}
