"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, MoonIcon, PauseIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import { completedActionCount, type BrainTrainingResult, type BreathingResult, type PlanActionId } from "@/lib/plan-state";
import { usePlan } from "./plan-provider";
import styles from "./plan-experience.module.css";
import consultationStyles from "./consultation-dialog.module.css";

type Session = PlanActionId | null;
type TrialPhase = "intro" | "waiting" | "target" | "complete";

export function AttentionSession({ onClose, onSaved }: Readonly<{ onClose: () => void; onSaved?: () => void }>) {
  const { dispatch } = usePlan();
  const [phase, setPhase] = useState<TrialPhase>("intro");
  const [trial, setTrial] = useState(0);
  const [responses, setResponses] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const missesRef = useRef(0);
  const targetStartedAt = useRef(0);
  const sessionStartedAt = useRef(0);
  const sessionId = useRef("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalTrials = 5;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { clearTimer(); dialog?.close(); };
  }, []);

  function finishTrials(nextMisses = missesRef.current) {
    clearTimer();
    setMisses(nextMisses);
    setDurationSeconds(Math.max(1, Math.round((performance.now() - sessionStartedAt.current) / 1000)));
    setPhase("complete");
  }

  function queueTrial(nextTrial: number) {
    clearTimer();
    setTrial(nextTrial);
    setPhase("waiting");
    timer.current = setTimeout(() => {
      targetStartedAt.current = performance.now();
      setPhase("target");
      timer.current = setTimeout(() => {
        const nextMisses = missesRef.current + 1;
        missesRef.current = nextMisses;
        if (nextTrial >= totalTrials) finishTrials(nextMisses);
        else {
          setMisses(nextMisses);
          queueTrial(nextTrial + 1);
        }
      }, 1500);
    }, 850 + Math.random() * 850);
  }

  function start() {
    sessionStartedAt.current = performance.now();
    sessionId.current = crypto.randomUUID();
    setResponses([]);
    setMisses(0);
    missesRef.current = 0;
    dispatch({ type: "start", id: "brain_training" });
    queueTrial(1);
  }

  function pressTarget() {
    if (phase === "waiting") {
      missesRef.current += 1;
      setMisses(missesRef.current);
      queueTrial(trial);
      return;
    }
    if (phase !== "target") return;
    const response = Math.round(performance.now() - targetStartedAt.current);
    clearTimer();
    setResponses((values) => [...values, response]);
    if (trial >= totalTrials) {
      finishTrials();
    } else {
      queueTrial(trial + 1);
    }
  }

  const result = useMemo(() => {
    if (phase !== "complete") return null;
    const sorted = [...responses].sort((a, b) => a - b);
    const midpoint = Math.floor(sorted.length / 2);
    const reactionTime = sorted.length === 0 ? null : sorted.length % 2 ? sorted[midpoint] : Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2);
    return {
      reactionTime,
      accuracy: Math.round((responses.length / (responses.length + misses)) * 100),
      missedResponses: misses,
      completedTrialCount: responses.length,
      baselineComparisonPercent: reactionTime === null ? null : Math.round(((reactionTime - 291) / 291) * 100),
      durationSeconds,
    };
  }, [durationSeconds, misses, phase, responses]);

  function save() {
    if (!result) return;
    const saved: BrainTrainingResult = {
      id: sessionId.current,
      type: "brain_training",
      ...result,
      completedAt: new Date().toISOString(),
    };
    dispatch({ type: "save_training", result: saved });
    onSaved?.();
    onClose();
  }

  function requestClose() {
    if (phase !== "intro" && !window.confirm(phase === "complete" ? "Discard this measured result without saving it?" : "Leave this task? The unfinished session will not be saved.")) return;
    if (phase !== "intro") dispatch({ type: "abandon", id: "brain_training" });
    onClose();
  }

  return (
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="training-title" onCancel={(event) => { event.preventDefault(); requestClose(); }}>
      <button className={styles.close} onClick={requestClose} aria-label="Close training"><XIcon size={20} /></button>
      <p className="eyebrow">Attention task · Demo protocol</p>
      <h2 id="training-title">Respond when the signal appears.</h2>
      {phase === "intro" ? <>
        <p>Complete five short trials. Pressing early counts as a missed response.</p>
        <button className="button button-primary" onClick={start}>Begin task</button>
      </> : null}
      {phase === "waiting" || phase === "target" ? <>
        <p className={styles.trial}>Trial {trial} of {totalTrials}</p>
        <button className={styles.target} data-visible={phase === "target"} onClick={pressTarget} aria-label={phase === "target" ? "Signal visible. Respond now" : "Wait for the signal"}>
          <span>{phase === "target" ? "Respond" : "Wait"}</span>
        </button>
        <p className={styles.hint}>{phase === "target" ? "Press now" : "The timing changes on every trial"}</p>
      </> : null}
      {phase === "complete" && result ? <>
        <div className={styles.resultGrid}>
          <div><span>Reaction</span><strong>{result.reactionTime !== null ? `${result.reactionTime} ms` : "No response"}</strong></div>
          <div><span>Accuracy</span><strong>{result.accuracy}%</strong></div>
          <div><span>Misses</span><strong>{result.missedResponses}</strong></div>
        </div>
        <p>{result.reactionTime === null || result.baselineComparisonPercent === null ? "No valid reaction result was captured; misses are still recorded." : `${result.baselineComparisonPercent > 0 ? `${result.baselineComparisonPercent}% slower` : `${Math.abs(result.baselineComparisonPercent)}% faster`} than the 291 ms demo baseline.`}</p>
        <p>Your measured result is saved only when you choose Save session.</p>
        <button className="button button-primary" onClick={save}>Save session</button>
      </> : null}
    </dialog>
  );
}

function BreathingSession({ onClose }: Readonly<{ onClose: () => void }>) {
  const { dispatch } = usePlan();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const totalSeconds = 300;
  const cyclePosition = elapsed % 12;
  const stage = cyclePosition < 4 ? "Inhale" : cyclePosition < 6 ? "Hold" : "Exhale";
  const stageDuration = stage === "Inhale" ? 4 : stage === "Hold" ? 2 : 6;
  const stageElapsed = stage === "Inhale" ? cyclePosition : stage === "Hold" ? cyclePosition - 4 : cyclePosition - 6;

  useEffect(() => {
    dispatch({ type: "start", id: "breathing" });
    const dialog = dialogRef.current;
    dialog?.showModal();
    const pauseWhenHidden = () => { if (document.hidden) setIsRunning(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => { document.removeEventListener("visibilitychange", pauseWhenHidden); dialog?.close(); };
  }, [dispatch]);

  useEffect(() => {
    if (!isRunning || isFinishing) return;
    const interval = window.setInterval(() => setElapsed((value) => {
      if (value + 1 >= totalSeconds) {
        setIsRunning(false);
        setIsFinishing(true);
        return totalSeconds;
      }
      return value + 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [isFinishing, isRunning]);

  function finish(feedback: "better" | "same" | "worse") {
    const result: BreathingResult = { id: sessionId.current, type: "breathing", feedback, durationSeconds: Math.max(1, elapsed), completedAt: new Date().toISOString() };
    dispatch({ type: "save_breathing", result });
    onClose();
  }

  function requestClose() {
    if (!window.confirm("Leave this breathing session? Progress will not be saved.")) return;
    dispatch({ type: "abandon", id: "breathing" });
    onClose();
  }

  return (
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="breathing-title" onCancel={(event) => { event.preventDefault(); requestClose(); }}>
      <button className={styles.close} onClick={requestClose} aria-label="Close breathing session"><XIcon size={20} /></button>
      <p className="eyebrow">Guided regulation · 4 / 2 / 6</p>
      <h2 id="breathing-title">Settle into a slower rhythm.</h2>
      {!isFinishing ? <>
        <div className={styles.breathingVisual} data-stage={stage.toLowerCase()}><span>{stage}</span><small>{Math.max(1, stageDuration - stageElapsed)}</small></div>
        <p className={styles.timer}>{Math.floor((totalSeconds - elapsed) / 60)}:{String((totalSeconds - elapsed) % 60).padStart(2, "0")} remaining</p>
        <div className={styles.sessionActions}>
          <button className="button button-secondary" onClick={() => setIsRunning((value) => !value)}>{isRunning ? <PauseIcon size={18} /> : <PlayIcon size={18} />}{isRunning ? "Pause" : "Resume"}</button>
          <button className="button button-primary" onClick={() => { setIsRunning(false); setIsFinishing(true); }}>Finish</button>
        </div>
      </> : <>
        <p>How do you feel after this session?</p>
        <div className={styles.feedback}>{(["better", "same", "worse"] as const).map((value) => <button key={value} onClick={() => finish(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
      </>}
    </dialog>
  );
}

function SleepGoalSession({ initialTarget, onClose }: Readonly<{ initialTarget: string; onClose: () => void }>) {
  const { dispatch } = usePlan();
  const [target, setTarget] = useState(initialTarget);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="sleep-goal-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button className={styles.close} onClick={onClose} aria-label="Close sleep goal"><XIcon size={20} /></button>
      <p className="eyebrow">Tonight&apos;s target</p>
      <h2 id="sleep-goal-title">Choose an in-bed time.</h2>
      <label className="source-copy" style={{ margin: "24px 0", color: "var(--muted)" }}>Target time<input style={{ border: "1px solid var(--border)", borderRadius: 14, background: "rgba(255,255,255,.04)", color: "var(--text)", padding: "14px 16px", font: "500 1rem var(--font-geist-mono)" }} type="time" value={target} onChange={(event) => setTarget(event.target.value)} required /></label>
      <button className="button button-primary" disabled={!target} onClick={() => { dispatch({ type: "set_sleep_goal", target }); onClose(); }}>Confirm sleep goal</button>
    </dialog>
  );
}

function ConsultationDialog({ onClose }: Readonly<{ onClose: () => void }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="consultation-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button className={styles.close} onClick={onClose} aria-label="Close consultation options"><XIcon size={20} /></button>
      <p className="eyebrow">Simulated consultation · No booking created</p>
      <h2 id="consultation-title">Talk through the pattern, not a diagnosis.</h2>
      <p>A future wellness consultation could review sleep routines, recovery context, and practical next steps. These example times are for demonstration only.</p>
      <div className={consultationStyles.options} aria-label="Simulated consultation times">
        {["Tomorrow · 11:00", "Thursday · 15:30"].map((slot) => <button key={slot} aria-pressed={selection === slot} onClick={() => setSelection(slot)}><span>Demo slot</span><strong>{slot}</strong></button>)}
      </div>
      {selection ? <p className={consultationStyles.confirmation} role="status"><CheckIcon size={18} />{selection} selected for preview. Nothing has been booked.</p> : null}
      <div className={styles.sessionActions}><button className="button button-secondary" onClick={() => setSelection("Contact team")}>Contact option · Demo</button><button className="button button-primary" onClick={onClose}>Done</button></div>
    </dialog>
  );
}

export function PlanExperience({ initialSession = null }: Readonly<{ initialSession?: Session }>) {
  const { state } = usePlan();
  const [session, setSession] = useState<Session>(initialSession);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const completed = completedActionCount(state);

  function start(id: PlanActionId) {
    setSession(id);
  }

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <div><p className="eyebrow">Your plan for today · Demo data</p><h1>Three clear priorities.</h1><p>Complete the next useful action without turning your day into another dashboard.</p></div>
        <div className={styles.progress} aria-live="polite"><strong>{completed}/{state.actions.length}</strong><span>complete</span></div>
      </header>

      <section className={styles.actions} aria-label="Daily plan">
        {state.actions.map((action, index) => (
          <article key={action.id} data-status={action.status}>
            <span className={styles.index}>0{index + 1}</span>
            <div><p>{action.duration}</p><h2>{action.title}</h2><span>{action.purpose}</span></div>
            <span className={styles.state}>{action.status === "completed" ? <><CheckIcon size={17} />Completed</> : action.status}</span>
            <button className="button button-primary" disabled={action.status === "completed"} onClick={() => start(action.id)}>
              {action.status === "completed" ? "Done" : action.id === "sleep_goal" ? <><MoonIcon size={18} />Set goal</> : "Start"}
            </button>
          </article>
        ))}
      </section>

      {state.sessions.length > 0 ? <section className={styles.history}><p className="eyebrow">Session history</p><h2>Latest measured result</h2>{state.sessions.slice(-1).map((result) => <div key={result.id}><span>{new Date(result.completedAt).toLocaleDateString()}</span>{result.type === "brain_training" ? <><strong>{result.reactionTime !== null ? `${result.reactionTime} ms` : "No response"}</strong><span>{result.accuracy}% accuracy</span></> : <><strong>Breathing</strong><span>{result.feedback} · {result.durationSeconds}s</span></>}</div>)}</section> : null}

      <section className={styles.consultation}><div><p className="eyebrow">Additional support</p><h2>Talk through your sleep pattern.</h2><p>Consultation availability is simulated in this competition demo.</p></div><button className="button button-secondary" onClick={() => setIsConsultationOpen(true)}>View demo options</button></section>

      {session === "brain_training" ? <AttentionSession onClose={() => setSession(null)} /> : null}
      {session === "breathing" ? <BreathingSession onClose={() => setSession(null)} /> : null}
      {session === "sleep_goal" ? <SleepGoalSession initialTarget={state.sleepGoal} onClose={() => setSession(null)} /> : null}
      {isConsultationOpen ? <ConsultationDialog onClose={() => setIsConsultationOpen(false)} /> : null}
    </div>
  );
}
