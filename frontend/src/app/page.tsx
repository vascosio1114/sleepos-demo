import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusPill } from "@/components/status-pill";
import { HomeProgress } from "@/components/home-progress";
import { alexDemo } from "@/lib/demo-data";
import { sevenDayTrends } from "@/lib/insight-rules";

const days = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];

function Sparkline({ values, label }: Readonly<{ values: readonly number[]; label: string }>) {
  const width = 300;
  const height = 78;
  const padding = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const normalized = (value - min) / range;
    const y = padding + (1 - normalized) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
      <line x1="0" y1={height - 1} x2={width} y2={height - 1} className="sparkline-axis" />
      <polyline points={points} className="sparkline-line" />
      {points.split(" ").map((point, index) => {
        const [cx, cy] = point.split(",");
        return <circle key={point} cx={cx} cy={cy} r={index === values.length - 1 ? 4 : 2} className={index === values.length - 1 ? "sparkline-point current" : "sparkline-point"} />;
      })}
    </svg>
  );
}

function SleepWeekChart() {
  const chartMaximum = 8;
  const baseline = 7.17;

  return (
    <div className="sleep-week-chart" role="img" aria-label="Sleep duration over seven days, decreasing from 7 hours 20 minutes to 6 hours 18 minutes. Baseline is 7 hours 10 minutes.">
      <div className="sleep-baseline" style={{ bottom: `${(baseline / chartMaximum) * 100}%` }}><span>Baseline 7h 10m</span></div>
      {sevenDayTrends.sleep.map((value, index) => (
        <div className="sleep-day" key={days[index]}>
          <div className="sleep-bar-track">
            <i className="sleep-bar" data-current={index === days.length - 1 || undefined} style={{ height: `${(value / chartMaximum) * 100}%` }} />
            {index === days.length - 1 ? <strong>6h 18m</strong> : null}
          </div>
          <span>{days[index]}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user, status, recommendation, updatedLabel } = alexDemo;

  return (
    <div className="page-container home-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">{updatedLabel} · Demo data</p>
          <h1>Good morning, {user.name}</h1>
          <p>Your overnight view.</p>
        </div>
        <HomeProgress />
      </header>

      <section className="health-summary" aria-labelledby="sleep-heading">
        <div className="health-summary-head">
          <div>
            <p className="eyebrow">Sleep</p>
            <h2 id="sleep-heading">Weekly sleep duration</h2>
          </div>
          <span className="chart-range-label">Last 7 days</span>
        </div>

        <div className="sleep-overview">
          <div className="sleep-chart-column">
            <div className="current-sleep"><strong>6h 18m</strong><span>Today · 52 min below baseline</span></div>
            <SleepWeekChart />
          </div>
          <div className="sleep-highlight">
            <StatusPill status={status.value} label={status.label} />
            <h3>{status.headline}</h3>
            <p>Sleep −52 min · HRV −6 ms</p>
            <Link className="text-link" href="/insights">View pattern <ArrowRightIcon size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="signal-summary" aria-labelledby="signals-heading">
        <div className="section-heading-row">
          <div><p className="eyebrow">Overnight signals</p><h2 id="signals-heading">Compared with your baseline</h2></div>
          <span>Last 7 days</span>
        </div>
        <div className="signal-trends">
          <Link className="signal-trend" href="/explore?system=heart_autonomic">
            <div className="signal-trend-copy"><span>HRV</span><strong>42 <small>ms</small></strong><p>−6 vs baseline</p></div>
            <div className="signal-trend-chart"><Sparkline values={sevenDayTrends.hrv} label="HRV decreased from 49 to 42 milliseconds over seven days" /><span>49</span><b>42 today</b><em>View details <ArrowRightIcon size={13} aria-hidden="true" /></em></div>
          </Link>
          <Link className="signal-trend" href="/explore?system=brain">
            <div className="signal-trend-copy"><span>Reaction</span><strong>312 <small>ms</small></strong><p>+21 vs baseline</p></div>
            <div className="signal-trend-chart"><Sparkline values={sevenDayTrends.reactionTime} label="Reaction time increased from 291 to 312 milliseconds over seven days" /><span>291</span><b>312 today</b><em>View details <ArrowRightIcon size={13} aria-hidden="true" /></em></div>
          </Link>
        </div>
      </section>

      <section className="recommendation" aria-labelledby="recommendation-heading">
        <div className="recommendation-marker"><span>Next</span><i aria-hidden="true" /></div>
        <div className="recommendation-copy">
          <p className="eyebrow">Recommended today</p>
          <h2 id="recommendation-heading">{recommendation.title}</h2>
          <span className="duration"><ClockIcon size={16} aria-hidden="true" />{recommendation.duration}</span>
        </div>
        <div className="recommendation-actions">
          <Link className="button button-primary" href={recommendation.startHref}>Start session</Link>
          <Link className="button button-secondary" href="/plan">View plan</Link>
        </div>
      </section>
    </div>
  );
}
