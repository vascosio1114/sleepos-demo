import type { Metadata } from "next";
import { VoiceBrainCoach } from "@/components/voice-brain-coach";

export const metadata: Metadata = { title: "Voice Brain Coach" };

export default function BrainCoachPage() {
  return <VoiceBrainCoach />;
}
