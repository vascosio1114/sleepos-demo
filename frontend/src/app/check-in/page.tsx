import type { Metadata } from "next";
import { CheckInExperience } from "@/components/check-in-experience";

export const metadata: Metadata = { title: "Voice check-in" };

export default function CheckInPage() {
  return <CheckInExperience />;
}