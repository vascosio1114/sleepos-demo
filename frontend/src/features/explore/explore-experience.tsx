"use client";

import Link from "next/link";
import { ArrowRightIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { exploreSystems, type ExploreSystemKey } from "./systems";
import styles from "./explore.module.css";
import focusStyles from "./organ-focus.module.css";

type ViewerState = "loading" | "ready" | "error" | "timeout";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function ExploreExperience({ initialSystem }: { initialSystem: ExploreSystemKey | null }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const closeButtonRef = useRef<HTMLAnchorElement>(null);
  const selectedKeyRef = useRef<ExploreSystemKey | null>(initialSystem);
  const [viewerKey, setViewerKey] = useState(0);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [selectedKey, setSelectedKey] = useState<ExploreSystemKey | null>(initialSystem);
  const selectedSystem = exploreSystems.find((system) => system.key === selectedKey) ?? null;

  useEffect(() => {
    const timeout = window.setTimeout(() => setViewerState((state) => state === "loading" ? "timeout" : state), 12000);
    const supportCheck = window.setTimeout(() => {
      if (!supportsWebGL()) {
        window.clearTimeout(timeout);
        setViewerState("error");
      }
    }, 0);
    const receive = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.source !== "sleepos-bodyparts3d") return;
      // `sandbox="allow-scripts"` gives the viewer an opaque origin (`null`), so the
      // exact WindowProxy is the trusted boundary. The iframe separately checks its parent source and referrer origin.
      if (event.data.type === "ready") {
        window.clearTimeout(timeout);
        setViewerState("ready");
        const selected = exploreSystems.find((system) => system.key === selectedKeyRef.current);
        if (selected?.modelLayer) {
          iframeRef.current?.contentWindow?.postMessage({ source: "sleepos-explore", type: "select", system: selected.modelLayer }, "*");
        }
      }
      if (event.data.type === "error") {
        window.clearTimeout(timeout);
        setViewerState("error");
      }
      if (event.data.type === "system_selected") {
        const selected = exploreSystems.find((system) => system.modelLayer === event.data.system);
        selectedKeyRef.current = selected?.key ?? null;
        setSelectedKey(selected?.key ?? null);
      }
    };
    window.addEventListener("message", receive);
    return () => { window.clearTimeout(supportCheck); window.clearTimeout(timeout); window.removeEventListener("message", receive); };
  }, [viewerKey]);

  useEffect(() => {
    if (!selectedKey) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        selectedKeyRef.current = null;
        setSelectedKey(null);
        iframeRef.current?.contentWindow?.postMessage({ source: "sleepos-explore", type: "clear" }, "*");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [selectedKey]);

  function selectSystem(key: ExploreSystemKey) {
    selectedKeyRef.current = key;
    setSelectedKey(key);
    const system = exploreSystems.find((candidate) => candidate.key === key);
    if (system?.modelLayer && viewerState === "ready") {
      iframeRef.current?.contentWindow?.postMessage({ source: "sleepos-explore", type: "select", system: system.modelLayer }, "*");
    }
  }

  function clearSelection() {
    selectedKeyRef.current = null;
    setSelectedKey(null);
    iframeRef.current?.contentWindow?.postMessage({ source: "sleepos-explore", type: "clear" }, "*");
  }

  function retryViewer() {
    setViewerState("loading");
    setViewerKey((key) => key + 1);
  }

  return (
    <div className={`${styles.experience} ${selectedSystem ? focusStyles.focused : ""} explore-canvas`} data-focused={selectedSystem ? true : undefined} style={{ minWidth: 0, maxWidth: "100%" }}>
      <section className={`${styles.viewerPanel} explore-viewer`} style={{ minWidth: 0, maxWidth: "100%" }} aria-labelledby="body-map-title">
        <div className={`${styles.viewerHeading} explore-viewer-heading`}>
          <div><p className={styles.kicker}>Explore · Body map</p><h2 id="body-map-title">Your body in context</h2><p className="explore-viewer-intro">Select a system to see its relationship with sleep and recovery.</p></div>
        </div>

        <div className={`${styles.stage} explore-stage`} data-state={viewerState}>
          <iframe
            key={viewerKey}
            ref={iframeRef}
            className={`${styles.modelFrame} explore-model-frame`}
            src="/explore/bodyparts3d.html"
            title="Interactive BodyParts3D human model"
            aria-describedby="model-guidance"
            aria-hidden={viewerState !== "ready"}
            tabIndex={viewerState === "ready" ? 0 : -1}
            sandbox="allow-scripts"
          />
          {viewerState === "ready" && ([
            { key: "muscle_recovery" as const, label: "Muscle region", top: "63%", left: "18%" },
            { key: "metabolic_labs" as const, label: "Metabolic region", top: "48%", left: "58%" },
          ]).map((region) => (
            <button
              key={region.key}
              type="button"
              aria-label={`${region.label}, labeled context only`}
              aria-pressed={selectedKey === region.key}
              onClick={() => setSelectedKey(region.key)}
              className={focusStyles.regionalLabel}
              style={{ position: "absolute", top: region.top, left: region.left, zIndex: 2, display: "grid", gap: 4, justifyItems: "center", border: 0, background: "transparent", color: "#d9e8ee", font: "600 .65rem var(--font-geist-mono)", transform: "translate(-50%,-50%)" }}
            >
              <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: "50%", background: selectedKey === region.key ? "#d7e5e7" : "#b78c60", border: "3px solid rgba(2,11,24,.72)", boxShadow: "0 0 0 1px rgba(215,229,231,.55)" }} />
              {region.label}
            </button>
          ))}
          {viewerState !== "ready" && (
            <div className={styles.viewerFallback} role={viewerState === "loading" ? "status" : "alert"}>
              {viewerState === "loading" ? <span className={styles.loader} aria-hidden="true" /> : <WarningCircleIcon size={28} aria-hidden="true" />}
              <strong>{viewerState === "loading" ? "Loading the body map" : viewerState === "timeout" ? "The body map is taking longer than expected" : "3D view unavailable"}</strong>
              <p>{viewerState === "loading" ? "The system list remains available while the verified layers load." : "Use the complete system list below, or retry the remote model assets."}</p>
              {viewerState !== "loading" && <button type="button" onClick={retryViewer}>Retry 3D view</button>}
            </div>
          )}
        </div>
        <p className={`${styles.guidance} explore-guidance`} id="model-guidance">Drag to rotate, scroll or pinch to zoom, or use the system buttons. Reduced-motion preferences disable automatic rotation.</p>
      </section>

      <aside className={`${styles.systemRail} ${selectedSystem ? focusStyles.focusRail : ""} explore-system-rail`} data-focused={selectedSystem ? true : undefined} style={{ minWidth: 0, maxWidth: "100%" }} aria-label={selectedSystem ? `${selectedSystem.label} context` : "Body systems"}>
        {selectedSystem ? <>
          <Link ref={closeButtonRef} className={focusStyles.focusClose} href="/explore" aria-label="Close organ focus" onClick={clearSelection}><XIcon size={18} aria-hidden="true" /></Link>
          <p className={styles.kicker}>{selectedSystem.status} · Organ context</p>
          <h2 className={focusStyles.focusTitle}>{selectedSystem.label}</h2>
          {selectedSystem.regionNote ? <p className={focusStyles.focusNote}>{selectedSystem.regionNote}</p> : null}
          <p className={focusStyles.focusSummary}>{selectedSystem.summary}</p>
          <dl className={focusStyles.focusMetrics}>{selectedSystem.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
          <div className={focusStyles.suggestionHead}><p className={styles.kicker}>Calendar suggestions</p><span>Choose what is useful</span></div>
          <div className={focusStyles.calendarSuggestions}>{selectedSystem.calendarSuggestions.map((suggestion, index) => <Link key={suggestion.label} href={suggestion.href}><span>0{index + 1}</span><div><strong>{suggestion.label}</strong><small>{suggestion.detail}</small></div><ArrowRightIcon size={15} aria-hidden="true" /></Link>)}</div>
          <p className={focusStyles.focusSafety}>Wellness context only. These suggestions do not diagnose a condition or replace professional care.</p>
        </> : <>
          <div className={`${styles.railHeading} explore-rail-heading`}><p className={styles.kicker}>Choose a system</p><p>Every option works without the 3D view.</p></div>
          <div className={`${styles.systemList} explore-system-list`} style={{ minWidth: 0, maxWidth: "100%" }}>
            {exploreSystems.map((system, index) => (
              <button className={`${styles.systemButton} explore-system-button`} data-selected={system.key === selectedKey} type="button" key={system.key} onClick={() => selectSystem(system.key)} aria-pressed={system.key === selectedKey} style={{ "--index": index } as React.CSSProperties}>
                <span><strong>{system.label}</strong><small>{system.modelLayer ? "Verified model layer" : "Labeled region"}</small></span>
                <span className={styles.systemStatus} data-tone={system.status === "Attention" ? "attention" : "calm"}>{system.status}</span>
              </button>
            ))}
          </div>
          <div className={`${styles.truthNote} explore-truth-note`}><InfoIcon aria-hidden="true" /><p>Brain, heart, lungs and gut are verified model layers. Muscle and metabolic views are labeled regional context only.</p></div>
        </>}
      </aside>
    </div>
  );
}
