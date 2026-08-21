"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

type AppShellMotionProps = {
  pathname: string;
  shellRef: RefObject<HTMLDivElement | null>;
};

const reduceMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Owns the shell's restrained transition language without adding layout DOM.
 * Every GSAP mutation is scoped to the shell and reverted on route changes.
 */
export function AppShellMotion({ pathname, shellRef }: AppShellMotionProps) {
  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const context = gsap.context(() => {
      const pageContent = shell.querySelectorAll(
        ".app-main > :not(.wellness-footer)",
      );
      const activeNavigation = shell.querySelectorAll(
        '.rail-link[aria-current="page"], .mobile-nav-link[aria-current="page"]',
      );

      if (window.matchMedia(reduceMotionQuery).matches) {
        if (pageContent.length > 0) {
          gsap.set(pageContent, {
            clearProps: "opacity,visibility,transform",
          });
        }
        if (activeNavigation.length > 0) {
          gsap.set(activeNavigation, {
            clearProps: "opacity,visibility,transform",
          });
        }
        return;
      }

      if (pageContent.length > 0) {
        gsap.fromTo(
          pageContent,
          { autoAlpha: 0, y: 10 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.28,
            ease: "power2.out",
            clearProps: "opacity,visibility,transform",
          },
        );
      }

      if (activeNavigation.length > 0) {
        gsap.fromTo(
          activeNavigation,
          { autoAlpha: 0.72, y: 2 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.22,
            ease: "power2.out",
            clearProps: "opacity,visibility,transform",
          },
        );
      }
    }, shell);

    return () => context.revert();
  }, [pathname, shellRef]);

  return null;
}
