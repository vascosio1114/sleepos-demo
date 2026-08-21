"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  CompassIcon,
  HouseIcon,
  ListChecksIcon,
  MicrophoneIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { AppShellMotion } from "@/components/app-shell-motion";

const destinations: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/brain-coach", label: "Voice", icon: MicrophoneIcon },
  { href: "/explore?view=brain", label: "Brain", icon: CompassIcon },
  { href: "/plan?start=brain-training", label: "Train", icon: ListChecksIcon },
];

function isDestinationActive(pathname: string, href: string) {
  const cleanHref = href.split("?")[0];
  return cleanHref === "/" ? pathname === cleanHref : pathname.startsWith(cleanHref);
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);

  return (
    <div className="app-shell" ref={shellRef}>
      <AppShellMotion pathname={pathname} shellRef={shellRef} />
      <aside className="desktop-rail" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="SleepOS home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>SleepOS</span>
        </Link>
        <nav className="rail-nav">
          {destinations.map(({ href, label, icon: NavIcon }) => {
            const isActive = isDestinationActive(pathname, href);
            return (
              <Link className="rail-link" data-active={isActive} href={href} key={href} aria-current={isActive ? "page" : undefined}>
                <NavIcon size={21} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="app-main" id="main-content">{children}</main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {destinations.map(({ href, label, icon: NavIcon }) => {
          const isActive = isDestinationActive(pathname, href);
          return (
            <Link className="mobile-nav-link" data-active={isActive} href={href} key={href} aria-current={isActive ? "page" : undefined}>
              <NavIcon size={22} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
