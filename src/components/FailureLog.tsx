/**
 * FailureLog.tsx
 *
 * Displays the append-only failure event history for accountability.
 * Shows today's failures prominently; all-time count in the header.
 *
 * Design: compact table with monospaced timestamps. No delete option —
 * the log is immutable by design.
 */

"use client";

import { useGrindStore } from "@/store/useGrindStore";
import { getDisciplineDay, formatLocalTime } from "@/lib/timeUtils";

export function FailureLog() {
  const failureHistory = useGrindStore((s) => s.failureHistory);
  const disciplineDay = getDisciplineDay();

  const todayFailures = failureHistory.filter(
    (f) => f.disciplineDay === disciplineDay
  );

  const allTimeCount = failureHistory.length;

  if (allTimeCount === 0) return null;

  return (
    <div className="border border-terminal-red/40 space-y-0">
      {/* Header */}
      <div className="border-b border-terminal-red/40 px-4 py-2 flex justify-between">
        <span className="text-terminal-red text-xs tracking-widest uppercase font-bold">
          FAILURE LOG
        </span>
        <span className="text-terminal-red/60 text-xs tracking-widest font-mono">
          {allTimeCount} TOTAL
        </span>
      </div>

      {/* Today's failures */}
      {todayFailures.length > 0 && (
        <div className="divide-y divide-terminal-red/20">
          {todayFailures.map((event, i) => (
            <div
              key={event.timestamp}
              className="flex justify-between items-center px-4 py-2"
            >
              <span className="text-terminal-red/60 text-xs font-mono tracking-widest">
                FAILURE {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-terminal-red text-xs font-mono tabular-nums tracking-wider">
                {formatLocalTime(event.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer if no failures today */}
      {todayFailures.length === 0 && (
        <div className="px-4 py-2">
          <p className="text-terminal-red/30 text-xs tracking-widest uppercase">
            NO FAILURES TODAY
          </p>
        </div>
      )}
    </div>
  );
}
