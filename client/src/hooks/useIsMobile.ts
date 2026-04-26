/**
 * useIsMobile
 * Returns true when the viewport width is below the `lg` Tailwind breakpoint (1024px).
 * Uses a ResizeObserver on the window so it stays in sync without a debounce.
 */
import { useState, useEffect } from "react";

const BREAKPOINT = 1024; // Tailwind `lg`

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.innerWidth < BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // Modern browsers
    mq.addEventListener("change", handler);
    // Sync immediately in case something changed between render and effect
    setIsMobile(mq.matches);

    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
