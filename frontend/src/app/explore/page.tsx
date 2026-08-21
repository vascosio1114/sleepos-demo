import type { Metadata } from "next";
import Link from "next/link";
import { ExploreExperience } from "@/features/explore/explore-experience";
import { isExploreSystemKey } from "@/features/explore/systems";
import { ExploreBrainView } from "@/components/explore-brain-view";

export const metadata: Metadata = { title: "Explore" };

type ExploreView = "body" | "brain";

function isExploreView(value: string | null | undefined): value is ExploreView {
  return value === "body" || value === "brain";
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ system?: string; view?: string }> }) {
  const params = await searchParams;
  const view: ExploreView = isExploreView(params.view) ? params.view : "body";
  const candidateSystem = params.system ?? null;
  const initialSystem = isExploreSystemKey(candidateSystem) ? candidateSystem : null;

  return (
    <div className="explore-page">
      <nav className="explore-mode-toggle" aria-label="Explore view toggle">
        <Link
          className="explore-mode-tab"
          data-active={view === "body"}
          href={initialSystem ? `/explore?view=body&system=${initialSystem}` : "/explore?view=body"}
        >
          Body
        </Link>
        <Link className="explore-mode-tab" data-active={view === "brain"} href="/explore?view=brain">
          Brain
        </Link>
      </nav>
      {view === "brain" ? <ExploreBrainView /> : <ExploreExperience initialSystem={initialSystem} />}
    </div>
  );
}