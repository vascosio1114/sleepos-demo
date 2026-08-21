// Brain domain + region educational context catalog.
// Per A2A plan §6.2 — Consumer layer only.
// All region labels carry `contextual, not directly measured` semantics.

import type { BrainDomain, RegionalScoreBrainKey } from "./types";

export interface DomainInfo {
  domain: BrainDomain;
  displayName: string;
  summary: string;
  /** Regions commonly associated with this functional domain (educational only). */
  regionKeys: ReadonlyArray<RegionalScoreBrainKey>;
  /** Plain-language note about how the SleepOS demo captures this domain. */
  demoNote: string;
}

export const DOMAIN_INFO: Readonly<Record<BrainDomain, DomainInfo>> = {
  attention: {
    domain: "attention",
    displayName: "Attention",
    summary: "How you focus, sustain attention, and respond to signals.",
    regionKeys: ["prefrontal", "cingulate", "parietal"],
    demoNote:
      "In the SleepOS demo, attention is sourced from reaction-time and accuracy in the five-trial brain training task. Self-report check-in values also contribute contextually.",
  },
  regulation: {
    domain: "regulation",
    displayName: "Stress regulation",
    summary: "How you manage stress and return to baseline.",
    regionKeys: ["amygdala", "prefrontal", "insula"],
    demoNote:
      "Stress regulation here is contextual, derived from reported stress and HRV trends. It is not a clinical measurement.",
  },
  memory: {
    domain: "memory",
    displayName: "Memory",
    summary: "How you retain and recall information day to day.",
    regionKeys: ["hippocampus", "temporal", "frontal"],
    demoNote:
      "Memory is recorded as a self-report score in the demo. Without an assessment protocol, no claim about memory performance is made.",
  },
  sleep_arousal: {
    domain: "sleep_arousal",
    displayName: "Sleep / arousal",
    summary: "How your nervous system winds down before sleep.",
    regionKeys: ["central", "frontal", "occipital"],
    demoNote:
      "Sleep / arousal is approximated from reported sleep minutes and stress. Without EEG data, this is contextual only.",
  },
};

export interface RegionInfo {
  brainKey: RegionalScoreBrainKey;
  displayName: string;
  description: string;
}

export const REGION_INFO: Readonly<Record<RegionalScoreBrainKey, RegionInfo>> = {
  frontal: { brainKey: "frontal", displayName: "Frontal lobe", description: "Planning, decision-making, voluntary movement." },
  prefrontal: { brainKey: "prefrontal", displayName: "Prefrontal cortex", description: "Executive function, attention regulation, working memory." },
  parietal: { brainKey: "parietal", displayName: "Parietal lobe", description: "Sensory integration and spatial awareness." },
  temporal: { brainKey: "temporal", displayName: "Temporal lobe", description: "Auditory processing, language, memory encoding." },
  occipital: { brainKey: "occipital", displayName: "Occipital lobe", description: "Visual processing." },
  central: { brainKey: "central", displayName: "Central region", description: "Sensorimotor coordination." },
  amygdala: { brainKey: "amygdala", displayName: "Amygdala", description: "Emotional salience and threat detection." },
  hippocampus: { brainKey: "hippocampus", displayName: "Hippocampus", description: "Memory consolidation and spatial navigation." },
  cingulate: { brainKey: "cingulate", displayName: "Cingulate cortex", description: "Attention, conflict monitoring, emotional regulation." },
  insula: { brainKey: "insula", displayName: "Insula", description: "Interoception, bodily awareness, emotional feeling." },
};

export const CONSUMER_LAYER_DISCLAIMER =
  "Contextual, not directly measured. Region labels are educational associations, not measured regional brain scores.";