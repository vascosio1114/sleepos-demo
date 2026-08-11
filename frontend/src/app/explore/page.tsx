import type { Metadata } from "next";
import { ExploreExperience } from "@/features/explore/explore-experience";
import { isExploreSystemKey } from "@/features/explore/systems";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ system?: string }> }) {
  const { system } = await searchParams;
  const candidateSystem = system ?? null;
  const initialSystem = isExploreSystemKey(candidateSystem) ? candidateSystem : null;
  return (
    <div className="explore-page">
      <ExploreExperience initialSystem={initialSystem} />
    </div>
  );
}
