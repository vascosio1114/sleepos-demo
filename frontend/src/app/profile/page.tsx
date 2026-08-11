import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/page-header";
import { alexDemo, sourceStatusLabel, type SourceStatus } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Profile" };

function SourceSection({ id, title, description, sources }: { id: string; title: string; description: string; sources: readonly { name: string; detail: string; status: SourceStatus }[] }) {
  return (
    <details className="source-section" id={id}>
      <summary className="source-heading"><div><h2>{title}</h2><p>{description}</p></div><span>{sources.length} sources</span></summary>
      <div className="source-list">
        {sources.map((source) => (
          <div className="source-row" key={source.name}>
            <span className="source-icon" aria-hidden="true"><DatabaseIcon size={19} /></span>
            <span className="source-copy"><strong>{source.name}</strong><span>{source.detail}</span></span>
            <span className="source-status" data-source-status={source.status}>{sourceStatusLabel(source.status)}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function ProfilePage() {
  const { user, sources } = alexDemo;
  return (
    <div className="page-container profile-page">
      <PageHeader eyebrow="Profile · Demo mode" title="Profile & data" description="Review what shapes your view." />
      <section className="profile-identity" aria-label="Demo profile">
        <div className="profile-monogram" aria-hidden="true">A</div>
        <div><p className="eyebrow">Demo profile</p><h2>{user.name}</h2><p>Age {user.age}</p></div>
        <span className="demo-label">Demo</span>
      </section>
      <div className="profile-sources">
        <SourceSection id="devices" title="Devices" description="Wearables and overnight signals" sources={sources.devices} />
        <SourceSection id="assessments" title="Assessments & Tests" description="Structured checks and baselines" sources={sources.assessments} />
        <SourceSection id="records" title="Records" description="Uploaded and recorded health context" sources={sources.records} />
      </div>
      <section className="settings-line">
        <ShieldCheckIcon size={22} aria-hidden="true" />
        <div><h2>Privacy & settings</h2><p>Demo data only.</p></div>
        <Link className="button button-secondary" href="/onboarding">Review</Link>
      </section>
    </div>
  );
}
