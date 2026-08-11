"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, BrainIcon, CheckIcon, MoonIcon, PauseIcon, PlayIcon, WindIcon, XIcon } from "@phosphor-icons/react";
import { completedActionCount, type BrainTrainingResult, type BreathingResult, type PlanActionId } from "@/lib/plan-state";
import { usePlan } from "./plan-provider";
import styles from "./plan-experience.module.css";
import consultationStyles from "./consultation-dialog.module.css";

type Session = PlanActionId | null;
type TrialPhase = "intro" | "waiting" | "target" | "complete";

const monthDays = [
  ...[27, 28, 29, 30, 31].map((date) => ({ date, month: "July", muted: true })),
  ...Array.from({ length: 31 }, (_, index) => ({ date: index + 1, month: "August", muted: false })),
  ...[1, 2, 3, 4, 5, 6].map((date) => ({ date, month: "September", muted: true })),
];

const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const brainHealthFactors = [
  { id: "sleep", label: "Sleep rhythm", short: "SLP", cadence: "Tue + Sun" },
  { id: "cardio", label: "Heart & cardio", short: "HRT", cadence: "Wednesday" },
  { id: "breathing", label: "Breathing", short: "BR", cadence: "Tuesday" },
  { id: "movement", label: "Daily movement", short: "MOV", cadence: "Monday" },
  { id: "strength", label: "Strength", short: "STR", cadence: "Saturday" },
  { id: "nutrition", label: "Nutrition", short: "NTR", cadence: "Wednesday" },
  { id: "metabolic", label: "Metabolic health", short: "MET", cadence: "Friday" },
  { id: "stress", label: "Stress reset", short: "RST", cadence: "Thursday" },
  { id: "social", label: "Social connection", short: "SOC", cadence: "Fri + Sun" },
  { id: "learning", label: "Learning", short: "LRN", cadence: "Monday" },
  { id: "environment", label: "Healthy environment", short: "ENV", cadence: "Thu + Sat" },
] as const;

type BrainHealthFactor = (typeof brainHealthFactors)[number];
const factorsById = new Map(brainHealthFactors.map((factor) => [factor.id, factor]));
const weeklyFactorPattern = [
  ["movement", "learning"],
  ["sleep", "breathing"],
  ["cardio", "nutrition"],
  ["stress", "environment"],
  ["social", "metabolic"],
  ["strength", "environment"],
  ["sleep", "social"],
] as const;

function factorsForAugustDate(date: number): readonly BrainHealthFactor[] {
  if (date === 11) return [factorsById.get("learning"), factorsById.get("breathing"), factorsById.get("sleep")].filter((factor): factor is BrainHealthFactor => Boolean(factor));
  const mondayFirstWeekday = (date + 4) % 7;
  return weeklyFactorPattern[mondayFirstWeekday].map((id) => factorsById.get(id)).filter((factor): factor is BrainHealthFactor => Boolean(factor));
}

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

  const progressValue = `${(completed / state.actions.length) * 100}%`;
  const schedule = {
    brain_training: { time: "09:30", window: "Morning" },
    breathing: { time: "15:00", window: "Afternoon" },
    sleep_goal: { time: "22:30", window: "Tonight" },
  } as const;

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <div><p className="eyebrow">Your plan · Demo data</p><h1>August 2026</h1></div>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ "--progress": progressValue } as React.CSSProperties} aria-live="polite"><span><strong>{completed}</strong> of {state.actions.length} complete</span><i aria-hidden="true" /></div>
          <p>{completed === state.actions.length ? "All priorities complete" : `${state.actions.length - completed} small steps remain`}</p>
        </div>
      </header>

      <section className={styles.calendar} aria-label="August 2026 calendar and schedule">
        <div className={styles.calendarTop}><div><span>August</span><strong>2026</strong></div><p>Today · Tuesday 11</p></div>
        <div className={styles.month} role="grid" aria-label="August 2026 month">
          {weekdayLabels.map((day) => <div className={styles.weekday} role="columnheader" key={day}>{day.slice(0, 3)}</div>)}
          {monthDays.map((day) => {
            const isToday = day.month === "August" && day.date === 11;
            const healthFactors = day.month === "August" ? factorsForAugustDate(day.date) : [];
            return (
              <div className={styles.monthDay} role="gridcell" aria-selected={isToday || undefined} data-muted={day.muted || undefined} data-today={isToday || undefined} key={`${day.month}-${day.date}`}>
                <span>{day.date}</span>
                {healthFactors.length ? <div className={styles.dayFactors} aria-label={healthFactors.map((factor) => factor.label).join(", ")}>{healthFactors.map((factor) => <span key={factor.id} data-factor={factor.id}><i>{factor.short}</i><b>{factor.label}</b></span>)}</div> : null}
              </div>
            );
          })}
        </div>

        <details className={styles.factorGuide}>
          <summary><span><span className="eyebrow">Monthly rhythm</span><strong id="brain-health-factors-heading">11 health factors</strong></span><span>View labels</span></summary>
          <div className={styles.factorIndex}>
            <div className={styles.factorList}>{brainHealthFactors.map((factor, index) => <div id={`factor-${factor.id}`} key={factor.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{factor.label}</strong><small>{factor.cadence}</small></div>)}</div>
            <div className={styles.annualCheckup} id="annual-checkup"><span>Yearly</span><div><strong>Annual checkup reminder</strong><small>Confirm the timing that fits you with a qualified clinician.</small></div></div>
          </div>
        </details>

        <div className={styles.agenda}>
          <div className={styles.agendaHead}><div><p className="eyebrow">Today</p><h2>Tuesday 11</h2></div><span>{state.actions.length} actions</span></div>
          <div className={styles.timeline}>
            {state.actions.map((action, index) => {
              const scheduled = schedule[action.id];
              return (
                <article className={styles.event} key={action.id} data-action={action.id} data-status={action.status}>
                  <time dateTime={`2026-08-11T${scheduled.time}`}>{scheduled.time}<span>{scheduled.window}</span></time>
                  <div className={styles.eventStem} aria-hidden="true"><i /></div>
                  <div className={styles.eventCard}>
                    <div className={styles.actionVisual} data-action={action.id} aria-hidden="true">
                      {action.id === "brain_training" ? <BrainIcon size={25} weight="light" /> : null}
                      {action.id === "breathing" ? <WindIcon size={25} weight="light" /> : null}
                      {action.id === "sleep_goal" ? <MoonIcon size={25} weight="light" /> : null}
                    </div>
                    <div className={styles.actionCopy}><p>{action.duration}</p><h3>{action.title}</h3><span>{action.purpose}</span></div>
                    {action.status !== "pending" ? <span className={styles.state}>{action.status === "completed" ? <><CheckIcon size={17} />Completed</> : action.status}</span> : null}
                    <button className={`button ${index === 0 ? "button-primary" : "button-secondary"}`} disabled={action.status === "completed"} onClick={() => start(action.id)}>
                      {action.status === "completed" ? "Done" : action.id === "sleep_goal" ? <><MoonIcon size={18} />Set goal</> : <>Start <ArrowRightIcon size={17} /></>}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {state.sessions.length > 0 ? <section className={styles.history}><p className="eyebrow">Session history</p><h2>Latest measured result</h2>{state.sessions.slice(-1).map((result) => <div key={result.id}><span>{new Date(result.completedAt).toLocaleDateString()}</span>{result.type === "brain_training" ? <><strong>{result.reactionTime !== null ? `${result.reactionTime} ms` : "No response"}</strong><span>{result.accuracy}% accuracy</span></> : <><strong>Breathing</strong><span>{result.feedback} · {result.durationSeconds}s</span></>}</div>)}</section> : null}

      <section className={styles.consultation}><div><p className="eyebrow">Optional support</p><h2>Talk through the pattern</h2></div><button className="button button-secondary" onClick={() => setIsConsultationOpen(true)}>View options</button></section>

      {session === "brain_training" ? <AttentionSession onClose={() => setSession(null)} /> : null}
      {session === "breathing" ? <BreathingSession onClose={() => setSession(null)} /> : null}
      {session === "sleep_goal" ? <SleepGoalSession initialTarget={state.sleepGoal} onClose={() => setSession(null)} /> : null}
      {isConsultationOpen ? <ConsultationDialog onClose={() => setIsConsultationOpen(false)} /> : null}
    </div>
  );
}
