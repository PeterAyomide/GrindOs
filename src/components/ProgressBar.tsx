/**
 * ProgressBar.tsx
 *
 * Horizontal full-width progress bar representing today's task completion.
 * Fills left-to-right from 0–100%. All-white fill = day complete.
 *
 * Uses a raw <div> fill (no CSS gradient, no rounding) for the brutalist
 * hard-edge aesthetic.
 */

"use client";

import { TASK_DEFINITIONS, useGrindStore } from "@/store/useGrindStore";

export function ProgressBar() {
  const progressPercent = useGrindStore((s) => s.progressPercent());
  const tasks = useGrindStore((s) => s.tasks);
  const isDayComplete = useGrindStore((s) => s.isDayComplete());

  const completedCount = TASK_DEFINITIONS.filter((t) => tasks[t.id]).length;
  const total = TASK_DEFINITIONS.length;

  return (
    <div className="space-y-2">
      {/* Numeric label */}
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-white/40 tracking-widest uppercase">
          PROTOCOL PROGRESS
        </span>
        <span
          className={`text-sm font-bold font-mono tracking-widest ${
            isDayComplete ? "text-white" : "text-white/60"
          }`}
        >
          {completedCount}/{total} &mdash; {progressPercent}%
        </span>
      </div>

      {/* Bar track */}
      <div
        className="w-full h-3 border border-white bg-black relative overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progressPercent}% of tasks completed`}
      >
        {/* Fill */}
        <div
          className={`
            absolute left-0 top-0 h-full
            transition-all duration-300 ease-out
            ${isDayComplete ? "bg-white" : "bg-white/80"}
          `}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Segment ticks — one per task */}
      <div className="flex gap-1">
        {TASK_DEFINITIONS.map((task) => (
          <div
            key={task.id}
            className={`flex-1 h-1 ${
              tasks[task.id] ? "bg-white" : "bg-white/15"
            }`}
            title={task.label}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
