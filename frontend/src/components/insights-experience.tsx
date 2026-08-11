"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { buildRecoveryInsight, sevenDayTrends } from "@/lib/insight-rules";
import { usePlan } from "./plan-provider";
import styles from "./insights-experience.module.css";

const insight = buildRecoveryInsight();
const maxHrv = Math.max(...sevenDayTrends.hrv);
const minHrv = Math.min(...sevenDayTrends.hrv);

export function InsightsExperience() {
  const { state } = usePlan();
  const breathing = state.actions.find((action) => action.id === "breathing");
  const isAdded = Boolean(breathing);

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Your top insight · Demo data</p>
          <h1>Patterns, explained carefully.</h1>
          <p>One evidence-backed observation, with the uncertainty kept visible.</p>
        </div>
        <span className={styles.signal}>Attention</span>
      </header>

      <section className={styles.lead} aria-labelledby="top-insight-heading">
        <p className="eyebrow">Recovery pattern</p>
        <h2 id="top-insight-heading">{insight.headline}</h2>
        <p>{insight.summary}</p>
        <div className={styles.evidence}>
          {insight.evidence.map((metric) => (
            <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.change}</small></div>
          ))}
        </div>
      </section>

      <section className={styles.trend} aria-labelledby="hrv-trend-heading">
        <div><p className="eyebrow">Seven days</p><h2 id="hrv-trend-heading">HRV moved below baseline</h2></div>
        <div className={styles.chart} role="img" aria-label={`HRV values over seven days: ${sevenDayTrends.hrv.join(", ")} milliseconds`}>
          {sevenDayTrends.hrv.map((value, index) => {
            const height = 30 + ((value - minHrv) / (maxHrv - minHrv)) * 70;
            return <span key={`${value}-${index}`} style={{ height: `${height}%`, "--bar-delay": `${index * 55}ms` } as React.CSSProperties}><i>{value}</i></span>;
          })}
        </div>
      </section>

      <section className={styles.explanation} aria-label="Insight explanation">
        <div><span>01</span><h3>What changed</h3><p>{insight.whatChanged}</p></div>
        <div><span>02</span><h3>What happened alongside it</h3><p>{insight.alongside}</p></div>
        <div><span>03</span><h3>What this may mean</h3><p>{insight.possibleRelationship}</p></div>
        <div><span>04</span><h3>Suggested next step</h3><p>{insight.nextAction}</p></div>
      </section>

      <details>
        <summary>How this insight was generated</summary>
        <p>Deterministic demo rules compared the current day with Alex&apos;s documented baseline. No diagnosis or AI-generated measurement was used.</p>
        <code>{insight.ruleIds.join(" · ")} · {insight.comparisonWindow}</code>
      </details>

      <div className={styles.actions}>
        <button className="button button-secondary" disabled={isAdded}>
          <CheckIcon size={18} aria-hidden="true" />
          Already in plan
        </button>
        <Link className="button button-primary" href="/plan?start=breathing">Start breathing <ArrowRightIcon size={18} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
