import type { Metadata } from "next";
import { PlanExperience } from "@/components/plan-experience";
import type { PlanActionId } from "@/lib/plan-state";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage({ searchParams }: Readonly<{ searchParams: Promise<{ start?: string }> }>) {
  const { start } = await searchParams;
  const initialSession: PlanActionId | null = start === "brain-training" ? "brain_training" : start === "breathing" ? "breathing" : null;
  return <PlanExperience initialSession={initialSession} />;
}
