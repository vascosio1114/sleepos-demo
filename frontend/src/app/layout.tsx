import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { preload } from "react-dom";
import { AppShell } from "@/components/app-shell";
import { PlanProvider } from "@/components/plan-provider";
import { VoiceAdviceProvider } from "@/lib/voice-advice";
import { wellnessDisclaimer } from "@/lib/demo-data";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SleepOS", template: "%s | SleepOS" },
  description: "A sleep and brain wellness intelligence experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  preload("/explore/models/body.glb", {
    as: "fetch",
    type: "model/gltf-binary",
    crossOrigin: "anonymous",
    fetchPriority: "high",
  });
  preload("/explore/models/skin-v6.glb", {
    as: "fetch",
    type: "model/gltf-binary",
    crossOrigin: "anonymous",
    fetchPriority: "high",
  });

  return (
    <html lang="en" className={`${outfit.variable} ${jetBrainsMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <PlanProvider>
          <VoiceAdviceProvider>
            <AppShell>
              {children}
              <footer className="wellness-footer">{wellnessDisclaimer}</footer>
            </AppShell>
          </VoiceAdviceProvider>
        </PlanProvider>
      </body>
    </html>
  );
}
