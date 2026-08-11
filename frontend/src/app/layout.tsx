import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PlanProvider } from "@/components/plan-provider";
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
  return (
    <html lang="en" className={`${outfit.variable} ${jetBrainsMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <PlanProvider>
          <AppShell>
            {children}
            <footer className="wellness-footer">{wellnessDisclaimer}</footer>
          </AppShell>
        </PlanProvider>
      </body>
    </html>
  );
}
