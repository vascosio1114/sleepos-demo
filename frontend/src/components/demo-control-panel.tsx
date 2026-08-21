"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon, TrashIcon } from "@phosphor-icons/react";
import { DEMO_SCRIPTS, resetDemoData, type DemoScript, type DemoScriptId, useDemoControl } from "@/lib/demo-control";
import styles from "./demo-control-panel.module.css";

interface DemoControlPanelProps {
  onRunScript?: (script: DemoScript) => void;
  compact?: boolean;
}

export function DemoControlPanel({ onRunScript, compact = false }: Readonly<DemoControlPanelProps>) {
  const { mode, activeScriptId, activeScript, setMode, setScript } = useDemoControl();

  const chooseScript = (scriptId: DemoScriptId) => {
    setScript(scriptId);
    const script = DEMO_SCRIPTS.find((item) => item.id === scriptId);
    if (script && onRunScript) onRunScript(script);
  };

  return (
    <section className={`${styles.panel} ${compact ? styles.compact : ""}`} aria-labelledby="demo-control-title">
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Demo control</p>
          <h2 id="demo-control-title">Run the story safely.</h2>
        </div>
        <button
          className={`button button-secondary ${styles.reset}`}
          onClick={() => {
            resetDemoData();
            window.location.reload();
          }}
        >
          <TrashIcon size={16} aria-hidden="true" /> Reset demo
        </button>
      </header>

      <div className={styles.modeSwitch} role="group" aria-label="Demo mode">
        <button type="button" data-active={mode === "stable" || undefined} onClick={() => setMode("stable")}>
          Stable Demo
          <span>Instant mock result</span>
        </button>
        <button type="button" data-active={mode === "live" || undefined} onClick={() => setMode("live")}>
          Live AI Demo
          <span>MiniMax / STT path</span>
        </button>
      </div>

      {!compact ? (
        <aside className={styles.judgeOverlay} aria-label="Judge demo guide">
          <Link className="button button-primary" href="/check-in">
            Start demo <ArrowRightIcon size={16} aria-hidden="true" />
          </Link>
          <div>
            <strong>What this proves</strong>
            <span>Voice check-in becomes safe advice, insight history, and brain-domain visuals.</span>
          </div>
          <div>
            <strong>What is simulated</strong>
            <span>Stable mode uses preset transcripts and mock advice so the live pitch never waits.</span>
          </div>
        </aside>
      ) : null}

      <div className={styles.scripts}>
        {DEMO_SCRIPTS.map((script) => (
          <article key={script.id} data-active={activeScriptId === script.id || undefined}>
            <button type="button" onClick={() => chooseScript(script.id)}>
              <strong>{script.title}</strong>
              <span>{script.expected}</span>
            </button>
            <p>{script.talkTrack}</p>
          </article>
        ))}
      </div>

      {activeScript ? (
        <div className={styles.footer}>
          <span><CheckIcon size={16} aria-hidden="true" /> Active path: {activeScript.title}</span>
          <Link className="button button-secondary" href={activeScript.nextRoute}>
            Expected next view <ArrowRightIcon size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
