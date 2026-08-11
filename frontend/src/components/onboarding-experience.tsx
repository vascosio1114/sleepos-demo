"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CheckIcon, WatchIcon } from "@phosphor-icons/react";
import { AttentionSession } from "./plan-experience";
import {
  ONBOARDING_STORAGE_KEY,
  createInitialOnboardingDraft,
  isOnboardingDraft,
  isValidOnboardingTime,
  onboardingGoals,
  type OnboardingDraft,
  type OnboardingGoal,
} from "@/lib/onboarding-state";
import styles from "./onboarding-experience.module.css";

const stageLabels = ["Welcome", "Goals", "Sleep baseline", "Brain assessment", "Wearable", "Ready"];

export function OnboardingExperience() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(createInitialOnboardingDraft);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let restored = createInitialOnboardingDraft();
    let restorationNotice: string | null = null;
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isOnboardingDraft(parsed)) restored = parsed;
        else {
          restorationNotice = "Saved onboarding progress was invalid and has been reset.";
        }
      }
    } catch {
      restorationNotice = "Onboarding progress could not be restored. You can continue with the Alex demo defaults.";
    }
    queueMicrotask(() => {
      setDraft(restored);
      setNotice(restorationNotice);
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      queueMicrotask(() => setNotice("Progress is available in this tab but could not be saved locally."));
    }
  }, [draft, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    stepHeadingRef.current?.focus();
  }, [draft.step, isHydrated]);

  function updateDraft(update: (current: OnboardingDraft) => OnboardingDraft) {
    setValidationMessage(null);
    setDraft(update);
  }

  function goTo(step: OnboardingDraft["step"]) {
    updateDraft((current) => ({ ...current, step, isComplete: false }));
  }

  function toggleGoal(goal: OnboardingGoal) {
    if (draft.goals.includes(goal)) {
      updateDraft((current) => ({ ...current, goals: current.goals.filter((value) => value !== goal) }));
      return;
    }
    if (draft.goals.length >= 3) {
      setValidationMessage("Choose up to three goals.");
      return;
    }
    updateDraft((current) => ({ ...current, goals: [...current.goals, goal] }));
  }

  function continueFromGoals() {
    if (draft.goals.length === 0) {
      setValidationMessage("Choose at least one goal to continue.");
      return;
    }
    goTo(2);
  }

  function continueFromBaseline() {
    if (!isValidOnboardingTime(draft.baseline.bedtime) || !isValidOnboardingTime(draft.baseline.wakeTime)) {
      setValidationMessage("Enter a valid bedtime and wake time.");
      return;
    }
    if (draft.baseline.quality === null) {
      setValidationMessage("Choose how your recent sleep has felt.");
      return;
    }
    goTo(3);
  }

  function finishOnboarding() {
    const completed: OnboardingDraft = { ...draft, step: 5, isComplete: true };
    setDraft(completed);
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completed));
    } catch {
      setNotice("Onboarding is complete for this tab, but the completion could not be saved locally.");
    }
    router.push("/");
  }

  function resetOnboarding() {
    updateDraft(() => createInitialOnboardingDraft());
  }

  if (!isHydrated) {
    return <div className={`page-container ${styles.page}`}><p className="eyebrow">Demo onboarding</p><h1>Restoring your place…</h1></div>;
  }

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <div><p className="eyebrow">Alex demo · Under two minutes</p><h1>Make SleepOS useful from the first screen.</h1></div>
        <div className={styles.progress} aria-label={`Onboarding stage ${draft.step + 1} of ${stageLabels.length}`}>
          <span>{String(draft.step + 1).padStart(2, "0")}</span><small>/ {String(stageLabels.length).padStart(2, "0")}</small>
        </div>
      </header>

      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <p className={styles.stageLabel}>{stageLabels[draft.step]}</p>

      <section className={styles.card} aria-live="polite">
        {draft.step === 0 ? <>
          <p className="eyebrow">Synthetic profile</p>
          <h2 ref={stepHeadingRef} tabIndex={-1}>Continue as Alex.</h2>
          <p>Use a consistent competition profile with synthetic sleep, recovery, and attention signals. Nothing here creates an account or connects real health data.</p>
          <button className="button button-primary" onClick={() => goTo(1)}>Continue as Alex</button>
        </> : null}

        {draft.step === 1 ? <>
          <p className="eyebrow">Step 1 · Improvement goals</p>
          <h2 ref={stepHeadingRef} tabIndex={-1}>What should feel better?</h2>
          <p>Choose one to three. These choices stay in this local demo.</p>
          <div className={styles.choiceGrid} aria-label="Improvement goals">
            {onboardingGoals.map((goal) => {
              const selected = draft.goals.includes(goal);
              return <button key={goal} type="button" aria-pressed={selected} data-selected={selected} onClick={() => toggleGoal(goal)}>{selected ? <CheckIcon size={18} /> : null}<span>{goal}</span></button>;
            })}
          </div>
          <div className={styles.actions}><button className="button button-secondary" onClick={() => goTo(0)}><ArrowLeftIcon size={18} />Back</button><button className="button button-primary" onClick={continueFromGoals}>Continue</button></div>
        </> : null}

        {draft.step === 2 ? <>
          <p className="eyebrow">Step 2 · Short baseline</p>
          <h2 ref={stepHeadingRef} tabIndex={-1}>Describe a usual night.</h2>
          <p>Use synthetic demo times only. No date of birth, medical history, or free text is collected.</p>
          <div className={styles.timeGrid}>
            <label>Usual bedtime<input type="time" value={draft.baseline.bedtime} onChange={(event) => updateDraft((current) => ({ ...current, baseline: { ...current.baseline, bedtime: event.target.value } }))} /></label>
            <label>Usual wake time<input type="time" value={draft.baseline.wakeTime} onChange={(event) => updateDraft((current) => ({ ...current, baseline: { ...current.baseline, wakeTime: event.target.value } }))} /></label>
          </div>
          <fieldset className={styles.quality}><legend>How has sleep felt recently?</legend>{([1, 2, 3, 4, 5] as const).map((quality) => <label key={quality}><input type="radio" name="sleep-quality" value={quality} checked={draft.baseline.quality === quality} onChange={() => updateDraft((current) => ({ ...current, baseline: { ...current.baseline, quality } }))} /><span>{quality}</span></label>)}</fieldset>
          <div className={styles.scaleLabels}><span>Poor</span><span>Restful</span></div>
          <div className={styles.actions}><button className="button button-secondary" onClick={() => goTo(1)}><ArrowLeftIcon size={18} />Back</button><button className="button button-primary" onClick={continueFromBaseline}>Continue</button></div>
        </> : null}

        {draft.step === 3 ? <>
          <p className="eyebrow">Step 3 · Brain baseline</p>
          <h2 ref={stepHeadingRef} tabIndex={-1}>Measure attention, or skip for now.</h2>
          <p>The same five-trial demo task used in Plan records reaction, accuracy, and misses. An abandoned task is not marked complete.</p>
          {draft.assessment === "completed" ? <p className={styles.completedLine}><CheckIcon size={19} />Demo assessment saved.</p> : null}
          <div className={styles.actions}><button className="button button-secondary" onClick={() => goTo(2)}><ArrowLeftIcon size={18} />Back</button><button className="button button-secondary" onClick={() => updateDraft((current) => ({ ...current, assessment: "skipped", step: 4 }))}>Skip assessment</button><button className="button button-primary" onClick={() => setShowAssessment(true)}>Start assessment</button></div>
        </> : null}

        {draft.step === 4 ? <>
          <p className="eyebrow">Step 4 · Wearable context</p>
          <h2 ref={stepHeadingRef} tabIndex={-1}>Use the demo wearable or skip.</h2>
          <p>No device permission is requested. “Demo wearable” keeps the existing synthetic Apple Watch values and never presents them as live.</p>
          <div className={styles.wearable}><WatchIcon size={28} /><div><strong>Apple Watch</strong><span>Synthetic overnight signals · Demo</span></div></div>
          <div className={styles.actions}><button className="button button-secondary" onClick={() => goTo(3)}><ArrowLeftIcon size={18} />Back</button><button className="button button-secondary" onClick={() => updateDraft((current) => ({ ...current, wearable: "skipped", step: 5 }))}>Skip wearable</button><button className="button button-primary" onClick={() => updateDraft((current) => ({ ...current, wearable: "demo", step: 5 }))}>Use demo wearable</button></div>
        </> : null}

        {draft.step === 5 ? <>
          <p className="eyebrow">Demo setup ready</p>
          <h2 ref={stepHeadingRef} tabIndex={-1}>Your Alex view is ready.</h2>
          <div className={styles.summary}>
            <div><span>Goals</span><strong>{draft.goals.join(" · ")}</strong></div>
            <div><span>Sleep baseline</span><strong>{draft.baseline.bedtime}–{draft.baseline.wakeTime} · {draft.baseline.quality}/5</strong></div>
            <div><span>Assessment</span><strong>{draft.assessment === "completed" ? "Completed" : "Skipped"}</strong></div>
            <div><span>Wearable</span><strong>{draft.wearable === "demo" ? "Demo values" : "Skipped"}</strong></div>
          </div>
          <div className={styles.actions}><button className="button button-secondary" onClick={() => goTo(4)}><ArrowLeftIcon size={18} />Back</button>{draft.isComplete ? <button className="button button-secondary" onClick={resetOnboarding}>Start over</button> : null}<button className="button button-primary" onClick={finishOnboarding}>Enter Home</button></div>
        </> : null}

        {validationMessage ? <p className={styles.validation} role="alert">{validationMessage}</p> : null}
      </section>

      <p className={styles.boundary}>Competition demo only · Synthetic Alex data · No account, booking, or wearable connection is created.</p>
      {showAssessment ? <AttentionSession onSaved={() => updateDraft((current) => ({ ...current, assessment: "completed", step: 4 }))} onClose={() => setShowAssessment(false)} /> : null}
    </div>
  );
}
