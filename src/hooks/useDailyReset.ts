/**
 * useDailyReset.ts
 *
 * Responsible for detecting discipline day boundaries and triggering the
 * store's performDailyReset action at exactly the right time.
 *
 * Strategy (two-layer protection):
 *   1. On mount: immediately check if a reset is overdue (handles missed resets
 *      while app was closed, e.g., user opens at 9 AM).
 *   2. Scheduled: set a setTimeout for the *next* 04:00 boundary, then
 *      recursively re-arm itself. This handles resets while the app is open.
 *
 * This hook must be mounted once, at the root of the app.
 */

"use client";

import { useEffect } from "react";
import { getDisciplineDay, msUntilNextReset } from "@/lib/timeUtils";
import { useGrindStore } from "@/store/useGrindStore";

export function useDailyReset(): void {
  const performDailyReset = useGrindStore((s) => s.performDailyReset);
  const lastResetDisciplineDay = useGrindStore(
    (s) => s.lastResetDisciplineDay
  );

  useEffect(() => {
    /**
     * Core check: compare the store's last known discipline day with the
     * current one. If they differ (or if the store is brand-new), reset.
     */
    function checkAndReset(): void {
      const currentDay = getDisciplineDay();
      performDailyReset(currentDay);
    }

    // Layer 1: Immediate check on mount — catches overdue resets.
    checkAndReset();

    // Layer 2: Schedule the next reset precisely at 04:00 local time.
    //          After it fires we re-schedule recursively.
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNextReset(): void {
      const delay = msUntilNextReset();
      timeoutId = setTimeout(() => {
        checkAndReset();
        // Re-arm for the following day
        scheduleNextReset();
      }, delay);
    }

    scheduleNextReset();

    // Cleanup on unmount (navigation away, HMR, etc.)
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: this effect must only run once on mount
}
