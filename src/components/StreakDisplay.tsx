/**
 * StreakDisplay.tsx
 *
 * Shows the current consecutive-day streak as a large numerical display.
 *
 * Streak semantics:
 *   - Increments at 04:00 if ALL tasks were completed the previous discipline day
 *   - Resets to 0 if any task was missed
 *   - Failure events (comfort button) do NOT affect streak
 */

"use client";

import { useGrindStore } from "@/store/useGrindStore";
import { Flame } from "lucide-react";

export function StreakDisplay() {
  const streak = useGrindStore((s) => s.streak);
  const isDayComplete = useGrindStore((s) => s.isDayComplete());

  // Determine streak visual state
  const isLive = streak > 0;
  const isTodayComplete = isDayComplete;

  return (
    <div className="border border-white p-6 flex flex-col items-center gap-2">
      {/* Label */}
      <p className="text-white/40 text-xs tracking-[0.4em] uppercase">
        CONSECUTIVE DAYS
      </p>

      {/* Main number */}
      <div className="flex items-center gap-3">
        {isLive && (
          <Flame
            size={32}
            className="text-terminal-red"
            aria-hidden="true"
          />
        )}
        <span
          className={`
            text-7xl font-bold leading-none tabular-nums
            ${isLive ? "text-white" : "text-white/30"}
          `}
          aria-label={`${streak} day streak`}
        >
          {String(streak).padStart(2, "0")}
        </span>
      </div>

      {/* Status line */}
      <p
        className={`text-xs tracking-widest uppercase mt-1 ${
          isTodayComplete ? "text-white" : "text-white/30"
        }`}
      >
        {isTodayComplete
          ? "TODAY: COMPLETE"
          : streak === 0
          ? "NO ACTIVE STREAK"
          : "TODAY: IN PROGRESS"}
      </p>

      {/* Motivational marker thresholds */}
      {streak > 0 && (
        <div className="flex gap-4 mt-2">
          {[7, 14, 30, 60, 100].map((threshold) => (
            <span
              key={threshold}
              className={`text-xs font-mono ${
                streak >= threshold ? "text-white" : "text-white/15"
              }`}
              title={`${threshold}-day milestone`}
            >
              {threshold}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
