"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, MoonIcon, PlayIcon, PauseIcon, SpeakerSimpleHighIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { buildRecoveryInsight, sevenDayTrends } from "@/lib/insight-rules";
import { usePlan } from "./plan-provider";
import { useVoiceAdvice } from "@/lib/voice-advice";
import styles from "./insights-experience.module.css";

const insight = buildRecoveryInsight();

function indexedPoints(values: readonly number[], invert = false) {
  const width = 800;
  const height = 220;
  const padding = 18;
  const chartMin = 84;
  const chartMax = 101;
  const start = values[0];
  return values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const relative = (value / start) * 100;
    const recoveryIndex = invert ? 200 - relative : relative;
    const y = padding + ((chartMax - recoveryIndex) / (chartMax - chartMin)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
}

function SignalChart() {
  const series = [
    { key: "sleep", label: "Sleep", values: sevenDayTrends.sleep, invert: false },
    { key: "hrv", label: "HRV", values: sevenDayTrends.hrv, invert: false },
    { key: "reaction", label: "Reaction", values: sevenDayTrends.reactionTime, invert: true },
  ] as const;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.legend} aria-hidden="true">
        {series.map((item) => <span key={item.key} data-series={item.key}><i />{item.label}</span>)}
        <small>7 days</small>
      </div>
      <svg className={styles.signalChart} viewBox="0 0 800 220" preserveAspectRatio="none" role="img" aria-label="Seven-day trends indexed to Monday at 100. Sleep and HRV declined while slower reaction time reduced the recovery index.">
        {[18, 110, 202].map((y) => <line key={y} x1="18" x2="782" y1={y} y2={y} />)}
        {series.map((item) => {
          const points = indexedPoints(item.values, item.invert);
          const [cx, cy] = points.split(" ").at(-1)?.split(",") ?? [0, 0];
          return <g key={item.key} data-series={item.key}><polyline points={points} /><circle cx={cx} cy={cy} r="5" /></g>;
        })}
      </svg>
      <div className={styles.days} aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className={styles.sleepDuration}>
        <div><MoonIcon size={18} weight="light" aria-hidden="true" /><span>Sleep duration</span><strong>6h 18m</strong></div>
        <div className={styles.durationTrack} aria-label="Sleep duration was 6 hours 18 minutes compared with a baseline of 7 hours 10 minutes"><i /><b /></div>
        <div className={styles.durationLabels}><span>Today</span><span>52 min below</span><span>7h 10m baseline</span></div>
      </div>
    </div>
  );
}

export function InsightsExperience() {
  const { state } = usePlan();
  const breathing = state.actions.find((action) => action.id === "breathing");
  const isAdded = Boolean(breathing);
  const { latestAdvice, refreshLatestAdvice } = useVoiceAdvice();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    refreshLatestAdvice();
  }, [refreshLatestAdvice]);

  function playSpeakable() {
    if (!latestAdvice || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestAdvice.speakableText);
    utterance.lang = "en-US";
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }
  function stopSpeakable() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Your top insight · Demo data</p>
          <h1>Your recovery pattern</h1>
        </div>
        <span className={styles.signal}>Attention</span>
      </header>

      <section className={styles.signalBoard} aria-labelledby="signal-board-heading">
        <div className={styles.boardHeader}><div><p className="eyebrow">7-day trend</p><h2 id="signal-board-heading">Sleep, HRV and reaction</h2></div><span>Monday = 100</span></div>
        <SignalChart />
        <div className={styles.evidence}>
          {insight.evidence.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.change}</small></div>)}
        </div>
      </section>

      <section className={styles.interpretation} aria-labelledby="top-insight-heading">
        <div><p className="eyebrow">Reading</p><h2 id="top-insight-heading">Recovery stayed below your range.</h2></div>
        <p>Shorter sleep and lower HRV coincided with slower reactions.</p>
      </section>

      <details className={styles.explanationDetails}>
        <summary>Read the full interpretation</summary>
        <section className={styles.explanation} aria-label="Insight explanation">
          <div><span>01</span><h3>What changed</h3><p>{insight.whatChanged}</p></div>
          <div><span>02</span><h3>Alongside it</h3><p>{insight.alongside}</p></div>
          <div><span>03</span><h3>Possible relationship</h3><p>{insight.possibleRelationship}</p></div>
          <div><span>04</span><h3>Next step</h3><p>{insight.nextAction}</p></div>
        </section>
      </details>

      <div className={styles.actions}>
        {isAdded ? <span className={styles.planState}><CheckIcon size={17} aria-hidden="true" />In today&apos;s plan</span> : null}
        <Link className="button button-primary" href="/plan?start=breathing">Start breathing <ArrowRightIcon size={18} aria-hidden="true" /></Link>
      </div>

      {latestAdvice ? (
        <section className={styles.adviceBoard} aria-labelledby="ai-advice-heading">
          <header>
            <p className="eyebrow">Latest voice check-in · AI guidance</p>
            <h2 id="ai-advice-heading">{latestAdvice.summary}</h2>
            <span className={styles[`safety-${latestAdvice.safetyLevel}`]}>{latestAdvice.safetyLevel}</span>
          </header>
          {latestAdvice.escalation ? (
            <p className={styles[`escalation-${latestAdvice.safetyLevel}`]}>
              <WarningCircleIcon size={18} aria-hidden="true" /> {latestAdvice.escalation.message}
            </p>
          ) : null}
          {latestAdvice.observations.length > 0 ? (
            <ul className={styles.observations}>
              {latestAdvice.observations.map((observation, index) => (
                <li key={index}>
                  <strong>{observation.statement}</strong>
                  <small>{observation.uncertainty}</small>
                </li>
              ))}
            </ul>
          ) : null}
          {latestAdvice.adviceItems.length > 0 ? (
            <ul className={styles.items}>
              {latestAdvice.adviceItems.map((item, index) => (
                <li key={`${item.actionType}-${index}`}>
                  <strong>{item.title}</strong>
                  <p>{item.reason}</p>
                  <small>{item.actionType.replace(/_/g, " ")}{item.routineKey ? ` · ${item.routineKey.replace(/_/g, " ")}` : ""}{item.durationMinutes > 0 ? ` · ${item.durationMinutes} min` : ""}</small>
                </li>
              ))}
            </ul>
          ) : null}
          <div className={styles.audioRow}>
            <button className={`button ${isPlaying ? "button-secondary" : "button-primary"}`} onClick={isPlaying ? stopSpeakable : playSpeakable} disabled={!latestAdvice.speakableText}>
              {isPlaying ? <><PauseIcon size={18} aria-hidden="true" /> Stop</> : <><PlayIcon size={18} aria-hidden="true" /> Play guidance</>}
            </button>
            <span className={styles.speakable}><SpeakerSimpleHighIcon size={18} aria-hidden="true" />{latestAdvice.speakableText}</span>
          </div>
          <Link className="button button-secondary" href="/check-in">Run a new check-in <ArrowRightIcon size={18} aria-hidden="true" /></Link>
        </section>
      ) : null}
    </div>
  );
}
