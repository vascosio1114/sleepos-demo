import type { Metadata } from "next";
import { InsightsExperience } from "@/components/insights-experience";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return <InsightsExperience />;
}
