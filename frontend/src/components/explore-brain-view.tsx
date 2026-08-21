"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowClockwiseIcon, ArrowRightIcon, BrainIcon, InfoIcon, KeyboardIcon, MinusIcon, PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useDemoControl } from "@/lib/demo-control";
import { useVoiceAdvice, voiceAdviceApi, CONSUMER_LAYER_DISCLAIMER, DOMAIN_INFO, REGION_INFO, type BrainDomain, type BrainScoreSnapshot, type RegionInfo } from "@/lib/voice-advice";
import styles from "./explore-brain-view.module.css";

const DOMAIN_ORDER: BrainDomain[] = ["attention", "regulation", "memory", "sleep_arousal"];

export function ExploreBrainView() {
  const { currentBrainScore, refreshBrainScore, isHydrated, latestAdvice } = useVoiceAdvice();
  const { highlightDomain, activeScript } = useDemoControl();
  const [history, setHistory] = useState<BrainScoreSnapshot[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<BrainDomain | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const domainButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchHistory = useCallback(async () => {
    setHistoryError(null);
    try {
      const snapshots = await voiceAdviceApi.brainScoreHistory();
      setHistory(snapshots);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load brain score history.");
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    queueMicrotask(() => {
      void fetchHistory();
    });
  }, [isHydrated, fetchHistory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshBrainScore();
      await fetchHistory();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshBrainScore, fetchHistory]);

  const focusDomain = useCallback((index: number) => {
    const next = (index + DOMAIN_ORDER.length) % DOMAIN_ORDER.length;
    setFocusedIndex(next);
    queueMicrotask(() => {
      domainButtonRefs.current[next]?.focus();
      domainButtonRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, []);

  const handleDomainsKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusDomain(focusedIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusDomain(focusedIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusDomain(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusDomain(DOMAIN_ORDER.length - 1);
      } else if (event.key === "Escape" && selectedDomain !== null) {
        event.preventDefault();
        setSelectedDomain(null);
      } else if ((event.key === "Enter" || event.key === " ") && document.activeElement === containerRef.current) {
        event.preventDefault();
        const domain = DOMAIN_ORDER[focusedIndex];
        setSelectedDomain((current) => (current === domain ? null : domain));
      }
    },
    [focusDomain, focusedIndex, selectedDomain],
  );

  useEffect(() => {
    if (!selectedDomain) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDomain(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedDomain]);

  useEffect(() => {
    if (!highlightDomain) return;
    const index = DOMAIN_ORDER.indexOf(highlightDomain);
    if (index < 0) return;
    queueMicrotask(() => {
      setSelectedDomain(highlightDomain);
      setFocusedIndex(index);
    });
  }, [highlightDomain]);

  if (!isHydrated) {
    return <p className={styles.muted}>Loading brain scores…</p>;
  }

  if (!currentBrainScore) {
    return (
      <p className={styles.muted}>
        <InfoIcon size={18} aria-hidden="true" /> No brain score snapshot yet. <Link href="/check-in">Run a voice check-in</Link> to generate one.
      </p>
    );
  }

  const currentDomainScores = currentBrainScore.domains;
  const trendByDomain = buildTrendByDomain(history ?? [], currentBrainScore);

  return (
    <section className={styles.view} aria-labelledby="brain-view-title">
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Explore · Brain mode</p>
          <h2 id="brain-view-title">Functional brain domains</h2>
          <p>{CONSUMER_LAYER_DISCLAIMER}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.modePill}>
            <BrainIcon size={18} aria-hidden="true" /> {currentBrainScore.mode.replace(/_/g, " ")}
          </span>
          <button className={`button button-secondary ${styles.refreshButton}`} onClick={handleRefresh} disabled={isRefreshing}>
            <ArrowClockwiseIcon size={16} aria-hidden="true" /> {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {latestAdvice ? (
        <p className={styles.adviceContext}>
          <InfoIcon size={16} aria-hidden="true" /> Latest check voice ran at safety level <strong>{latestAdvice.safetyLevel}</strong>. Brain scores below reflect your most recent snapshot.
        </p>
      ) : null}

      {highlightDomain ? (
        <p className={styles.storyCue}>
          <BrainIcon size={16} aria-hidden="true" /> Voice to advice to brain: highlighting <strong>{DOMAIN_INFO[highlightDomain].displayName}</strong>
          {activeScript ? ` from ${activeScript.title}.` : "."}
        </p>
      ) : null}

      <p className={styles.kbdHint}>
        <KeyboardIcon size={14} aria-hidden="true" /> Use <kbd>↑</kbd> / <kbd>↓</kbd> to move between domains, <kbd>Enter</kbd> to expand, <kbd>Esc</kbd> to collapse.
      </p>

      <div
        className={styles.domains}
        ref={containerRef}
        tabIndex={0}
        aria-label="Brain domains"
        aria-activedescendant={DOMAIN_ORDER[focusedIndex] ? `domain-button-${DOMAIN_ORDER[focusedIndex]}` : undefined}
        onKeyDown={handleDomainsKeyDown}
      >
        {currentDomainScores.map((domain, index) => {
          const info = DOMAIN_INFO[domain.key];
          const trend = trendByDomain[domain.key] ?? [];
          const isSelected = selectedDomain === domain.key;
          const isFocused = focusedIndex === index;
          return (
            <article
              key={domain.key}
              className={styles.domain}
              data-status={domain.status}
              data-selected={isSelected || undefined}
              data-highlighted={highlightDomain === domain.key || undefined}
            >
              <button
                id={`domain-button-${domain.key}`}
                type="button"
                className={styles.domainHead}
                ref={(element) => {
                  domainButtonRefs.current[index] = element;
                }}
                onClick={() => setSelectedDomain(isSelected ? null : domain.key)}
                onFocus={() => setFocusedIndex(index)}
                aria-controls={`domain-panel-${domain.key}`}
                aria-expanded={isSelected}
                tabIndex={isFocused ? 0 : -1}
              >
                <div className={styles.domainHeadCopy}>
                  <h3>{info.displayName}</h3>
                  <p>{info.summary}</p>
                </div>
                <div className={styles.domainHeadMetric}>
                  <strong>{domain.score === 0 ? "—" : `${domain.score} / 100`}</strong>
                  <span>{domain.quality}</span>
                  {isSelected ? <MinusIcon size={18} aria-hidden="true" /> : <PlusIcon size={18} aria-hidden="true" />}
                </div>
              </button>

              <DomainTrend
                
                trend={trend}
                baseline={domain.score}
              />

              {isSelected ? (
                <div
                  id={`domain-panel-${domain.key}`}
                  className={styles.domainPanel}
                  aria-live="polite"
                >
                  <DomainDetail
                    domainKey={domain.key}
                    capturedAt={currentBrainScore.capturedAt}
                    quality={domain.quality}
                    measured={domain.measured}
                    sourceMetricKeys={domain.sourceMetricKeys}
                    history={trend}
                  />
                  <RegionList domain={domain.key} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <p className={styles.note}>
        Regional brain scores are intentionally not shown. Without qualified QEEG or HEG data we cannot safely infer a regional heatmap. The 5D view is reserved for the trainer layer and is not part of this MVP.
      </p>

      <div className={styles.footer}>
        <Link className="button button-primary" href="/check-in">
          Run a voice check-in to refresh <ArrowRightIcon size={18} aria-hidden="true" />
        </Link>
        {historyError ? (
          <p className={styles.error} role="alert">
            <WarningCircleIcon size={16} aria-hidden="true" /> History: {historyError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

interface DomainTrendProps {
  trend: number[];
  baseline: number;
}

function DomainTrend({ trend, baseline }: DomainTrendProps) {
  if (trend.length === 0) {
    return <p className={styles.trendEmpty}>Demo trend only · 0 prior snapshots</p>;
  }
  const width = 220;
  const height = 48;
  const padding = 4;
  const min = Math.min(...trend, baseline);
  const max = Math.max(...trend, baseline);
  const range = max - min || 1;
  const points = trend.map((value, index) => {
    const x = padding + (index / (trend.length - 1 || 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className={styles.trendWrap}>
      <svg className={styles.trendSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`7-day demo trend for this domain`} preserveAspectRatio="none">
        <polyline points={points} className={styles.trendLine} />
        {trend.map((value, index) => {
          const x = padding + (index / (trend.length - 1 || 1)) * (width - padding * 2);
          const y = padding + (1 - (value - min) / range) * (height - padding * 2);
          return <circle key={index} cx={x} cy={y} r="3" className={styles.trendPoint} />;
        })}
      </svg>
      <small>Demo trend · {trend.length} snapshots</small>
    </div>
  );
}

function DomainDetail({
  domainKey,
  capturedAt,
  quality,
  measured,
  sourceMetricKeys,
  history,
}: {
  domainKey: BrainDomain;
  capturedAt: string;
  quality: BrainScoreSnapshot["domains"][number]["quality"];
  measured: boolean;
  sourceMetricKeys: ReadonlyArray<string>;
  history: number[];
}) {
  const baseline = history.at(-2);
  const latest = history.at(-1);
  const delta = baseline !== undefined && latest !== undefined ? latest - baseline : null;
  return (
    <div className={styles.detail}>
      <h4>Snapshot detail</h4>
      <dl>
        <div><dt>Captured at</dt><dd>{new Date(capturedAt).toLocaleString()}</dd></div>
        <div><dt>Quality</dt><dd>{quality}</dd></div>
        <div><dt>Source</dt><dd>{measured ? "Measured signal" : "Self-reported / contextual"}</dd></div>
        <div><dt>Source keys</dt><dd>{sourceMetricKeys.length === 0 ? "— none" : sourceMetricKeys.join(", ")}</dd></div>
        <div><dt>Recent change</dt><dd>{delta === null ? "No prior snapshot" : `${delta > 0 ? "+" : ""}${delta} pts vs previous`}</dd></div>
      </dl>
      <p className={styles.detailNote}>{DOMAIN_INFO[domainKey].demoNote}</p>
    </div>
  );
}

function RegionList({ domain }: { domain: BrainDomain }) {
  const info = DOMAIN_INFO[domain];
  return (
    <div className={styles.regionBlock}>
      <h4>Educational region context</h4>
      <p className={styles.regionDisclaimer}>{CONSUMER_LAYER_DISCLAIMER}</p>
      <ul className={styles.regions}>
        {info.regionKeys.map((regionKey) => {
          const region: RegionInfo = REGION_INFO[regionKey];
          return (
            <li key={regionKey}>
              <strong>{region.displayName}</strong>
              <span>{region.description}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function buildTrendByDomain(history: BrainScoreSnapshot[], current: BrainScoreSnapshot): Record<BrainDomain, number[]> {
  const result: Record<BrainDomain, number[]> = {
    attention: [],
    regulation: [],
    memory: [],
    sleep_arousal: [],
  };
  const sortedHistory = [...history].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  for (const domainKey of DOMAIN_ORDER) {
    const series = sortedHistory
      .map((snapshot) => snapshot.domains.find((d) => d.key === domainKey)?.score ?? null)
      .filter((value): value is number => typeof value === "number");
    const currentScore = current.domains.find((d) => d.key === domainKey)?.score ?? null;
    if (typeof currentScore === "number") series.push(currentScore);
    result[domainKey] = series;
  }
  return result;
}
