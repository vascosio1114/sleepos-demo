import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ExploreExperience } from "@/features/explore/explore-experience";
import { isExploreSystemKey } from "@/features/explore/systems";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ system?: string }> }) {
  const { system } = await searchParams;
  const candidateSystem = system ?? null;
  const initialSystem = isExploreSystemKey(candidateSystem) ? candidateSystem : null;
  return (
    <div className="page-container">
      <PageHeader eyebrow="Explore" title="Your body in context" description="Explore signals that may be related to sleep, recovery and daytime focus." />
      <ExploreExperience initialSystem={initialSystem} />
    </div>
  );
}
