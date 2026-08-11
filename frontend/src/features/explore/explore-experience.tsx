"use client";

import Link from "next/link";
import { ArrowCounterClockwiseIcon, ArrowRightIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { exploreSystems, type ExploreSystemKey } from "./systems";
import styles from "./explore.module.css";

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const detailSheetRef = useRef<HTMLElement>(null);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        selectedKeyRef.current = null;
        setSelectedKey(null);
        iframeRef.current?.contentWindow?.postMessage({ source: "sleepos-explore", type: "clear" }, "*");
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(detailSheetRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
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

  function resetViewer() {
    clearSelection();
    iframeRef.current?.contentWindow?.postMessage({ source: "sleepos-explore", type: "reset" }, "*");
  }

  function retryViewer() {
    setViewerState("loading");
    setViewerKey((key) => key + 1);
  }

  return (
    <div className={styles.experience} style={{ minWidth: 0, maxWidth: "100%" }}>
      <section className={styles.viewerPanel} style={{ minWidth: 0, maxWidth: "100%" }} aria-labelledby="body-map-title">
        <div className={styles.viewerHeading}>
          <div><p className={styles.kicker}>Body map · Demo</p><h2 id="body-map-title">Systems related to sleep</h2></div>
          <button className={styles.resetButton} type="button" onClick={resetViewer} disabled={viewerState !== "ready"}>
            <ArrowCounterClockwiseIcon aria-hidden="true" /> Reset view
          </button>
        </div>

        <div className={styles.stage} data-state={viewerState}>
          <iframe
            key={viewerKey}
            ref={iframeRef}
            className={styles.modelFrame}
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
        <p className={styles.guidance} id="model-guidance">Drag to rotate, scroll or pinch to zoom, or use the system buttons. Reduced-motion preferences disable automatic rotation.</p>
      </section>

      <aside className={styles.systemRail} style={{ minWidth: 0, maxWidth: "100%" }} aria-label="Body systems">
        <div className={styles.railHeading}><p className={styles.kicker}>Choose a system</p><p>Every option works without the 3D view.</p></div>
        <div className={styles.systemList} style={{ minWidth: 0, maxWidth: "100%" }}>
          {exploreSystems.map((system, index) => (
            <button className={styles.systemButton} data-selected={system.key === selectedKey} type="button" key={system.key} onClick={() => selectSystem(system.key)} aria-pressed={system.key === selectedKey} aria-expanded={system.key === selectedKey} aria-controls={system.key === selectedKey ? "system-detail-sheet" : undefined} style={{ "--index": index } as React.CSSProperties}>
              <span><strong>{system.label}</strong><small>{system.modelLayer ? "Verified model layer" : "Labeled region"}</small></span>
              <span className={styles.systemStatus} data-tone={system.status === "Attention" ? "attention" : "calm"}>{system.status}</span>
            </button>
          ))}
        </div>
        <div className={styles.truthNote}><InfoIcon aria-hidden="true" /><p>Brain, heart, lungs and gut are verified model layers. Muscle and metabolic views are labeled regional context only.</p></div>
      </aside>

      {selectedSystem && (
        <div className={styles.sheetBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) clearSelection(); }}>
          <section id="system-detail-sheet" ref={detailSheetRef} className={styles.detailSheet} role="dialog" aria-modal="true" aria-labelledby="system-sheet-title">
            <button ref={closeButtonRef} className={styles.closeButton} type="button" aria-label="Close system details" onClick={clearSelection}><XIcon aria-hidden="true" /></button>
            <p className={styles.kicker}>{selectedSystem.status} · Demo signals</p>
            <h2 id="system-sheet-title">{selectedSystem.label}</h2>
            {selectedSystem.regionNote && <p className={styles.regionNote}>{selectedSystem.regionNote}</p>}
            <p className={styles.systemSummary}>{selectedSystem.summary}</p>
            <dl className={styles.metricList}>{selectedSystem.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
            <div className={styles.sheetActions}>
              <Link className={styles.primaryAction} href={selectedSystem.primaryAction.href}>{selectedSystem.primaryAction.label}<ArrowRightIcon aria-hidden="true" /></Link>
              {selectedSystem.secondaryAction && <Link className={styles.secondaryAction} href={selectedSystem.secondaryAction.href}>{selectedSystem.secondaryAction.label}</Link>}
            </div>
            <p className={styles.safetyCopy}>These wellness signals may provide context; they do not diagnose a condition or establish a cause.</p>
          </section>
        </div>
      )}
    </div>
  );
}
