/**
 * useLiveClock.ts
 *
 * Returns a live-updating HH:MM:SS string in the user's local timezone.
 * Updates every second via setInterval.
 *
 * Initialized to empty string to avoid hydration mismatch between
 * server render and client (server has no concept of "user local time").
 */

"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/timeUtils";

export function useLiveClock(): string {
  // Start empty — prevents SSR/client hydration mismatch
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    // Sync immediately on mount
    setClock(formatClock(new Date()));

    const interval = setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return clock;
}
