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
  const customTasks = useGrindStore((s) => s.customTasks);
  const customTaskCompletions = useGrindStore((s) => s.customTaskCompletions);
  const isDayComplete = useGrindStore((s) => s.isDayComplete());

  const builtinDone = TASK_DEFINITIONS.filter((t) => tasks[t.id]).length;
  const customDone = customTasks.filter((t) => customTaskCompletions[t.id]).length;
  const completedCount = builtinDone + customDone;
  const total = TASK_DEFINITIONS.length + customTasks.length;

  // Combined task IDs + completion for segment ticks
  const allSegments = [
    ...TASK_DEFINITIONS.map((t) => ({ id: t.id, done: tasks[t.id], label: t.label })),
    ...customTasks.map((t) => ({ id: t.id, done: customTaskCompletions[t.id] ?? false, label: t.label })),
  ];

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

      {/* Segment ticks — one per task (built-in + custom) */}
      <div className="flex gap-1">
        {allSegments.map((seg) => (
          <div
            key={seg.id}
            className={`flex-1 h-1 ${seg.done ? "bg-white" : "bg-white/15"}`}
            title={seg.label}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
