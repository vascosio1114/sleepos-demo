import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PlanProvider } from "@/components/plan-provider";
import { wellnessDisclaimer } from "@/lib/demo-data";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SleepOS", template: "%s | SleepOS" },
  description: "A sleep and brain wellness intelligence experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
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
