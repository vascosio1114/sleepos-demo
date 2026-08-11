import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusPill } from "@/components/status-pill";
import { HomeProgress } from "@/components/home-progress";
import { alexDemo } from "@/lib/demo-data";

export default function HomePage() {
  const { user, status, metrics, recommendation, updatedLabel } = alexDemo;

  return (
    <div className="page-container home-page">
      <header className="home-header enter" style={{ "--delay": "0ms" } as React.CSSProperties}>
        <div>
          <p className="eyebrow">{updatedLabel} · Demo data</p>
          <h1>Good morning, {user.name}</h1>
          <p>Your daily sleep and brain brief is ready.</p>
        </div>
        <HomeProgress />
      </header>

      <section className="status-feature enter" style={{ "--delay": "70ms" } as React.CSSProperties} aria-labelledby="status-heading">
        <div className="status-copy">
          <StatusPill status={status.value} label={status.label} />
          <h2 id="status-heading">{status.headline}</h2>
          <p>{status.description}</p>
          <Link className="text-link" href="/insights">See what changed <ArrowRightIcon size={17} aria-hidden="true" /></Link>
        </div>
        <div className="status-orbit" aria-hidden="true">
          <span className="orbit-core" />
          <span className="orbit-line orbit-line-one" />
          <span className="orbit-line orbit-line-two" />
        </div>
      </section>

      <section className="metrics-section enter" style={{ "--delay": "140ms" } as React.CSSProperties} aria-labelledby="metrics-heading">
        <div className="section-heading-row">
          <div><p className="eyebrow">Three signals</p><h2 id="metrics-heading">Today at a glance</h2></div>
          <span>Compared with your baseline</span>
        </div>
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <Link className="metric-row" href={metric.href} key={metric.key}>
              <span className="metric-index">0{index + 1}</span>
              <span className="metric-copy"><span>{metric.label}</span><strong>{metric.value}</strong></span>
              <span className="metric-detail">{metric.detail}</span>
              <ArrowRightIcon size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="recommendation enter" style={{ "--delay": "210ms" } as React.CSSProperties} aria-labelledby="recommendation-heading">
        <div className="recommendation-marker"><span>Next</span><i aria-hidden="true" /></div>
        <div className="recommendation-copy">
          <p className="eyebrow">Recommended today</p>
          <h2 id="recommendation-heading">{recommendation.title}</h2>
          <p>{recommendation.description}</p>
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
