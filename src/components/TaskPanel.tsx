/**
 * TaskPanel.tsx — v2
 *
 * Updated to support:
 *   - Pomodoro timer per task row
 *   - Task ordering lock (isLocked per row)
 *   - enforcePomodoro mode (checkbox disabled, must use timer)
 *   - Both built-in TaskDefinition and CustomTask shapes
 */

"use client";

import { TaskCategory, useGrindStore } from "@/store/useGrindStore";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { Lock } from "lucide-react";

// Minimal shared task shape — both TaskDefinition and CustomTask satisfy this
export interface AnyTask {
  id: string;
  label: string;
  category: TaskCategory;
  duration: string;
  description: string;
  pomoDurationMinutes: number;
}

interface TaskPanelProps {
  category: TaskCategory;
  tasks: AnyTask[];
  label: string;
  /** Task IDs that are locked due to enforceTaskOrder */
  lockedTaskIds: Set<string>;
  /** Called when a task checkbox is clicked */
  onToggle: (id: string) => void;
  /** Whether these tasks are completed — keyed by task id */
  completions: Record<string, boolean>;
}

export function TaskPanel({
  category,
  tasks,
  label,
  lockedTaskIds,
  onToggle,
  completions,
}: TaskPanelProps) {
  const enforcePomodoro = useGrindStore((s) => s.enforcePomodoro);

  const completedCount = tasks.filter((t) => completions[t.id]).length;
  const total = tasks.length;
  const allDone = completedCount === total;

  return (
    <section>
      {/* Panel header */}
      <div
        className={`
          border-b border-white p-3 flex justify-between items-center
          ${allDone ? "bg-white" : "bg-black"}
        `}
      >
        <h2
          className={`text-xs font-bold tracking-[0.3em] uppercase ${
            allDone ? "text-black" : "text-white"
          }`}
        >
          {allDone ? "✓ " : ""}
          {label}
        </h2>
        <span
          className={`text-xs font-mono tracking-widest ${
            allDone ? "text-black/60" : "text-white/50"
          }`}
        >
          {completedCount}/{total}
        </span>
      </div>

      {/* Task list */}
      <ul className="divide-y divide-white/10">
        {tasks.map((task) => {
          const isCompleted = completions[task.id] ?? false;
          const isLocked = lockedTaskIds.has(task.id);

          return (
            <TaskRow
              key={task.id}
              task={task}
              isCompleted={isCompleted}
              isLocked={isLocked}
              enforcePomodoro={enforcePomodoro}
              onToggle={() => onToggle(task.id)}
            />
          );
        })}
      </ul>
    </section>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: AnyTask;
  isCompleted: boolean;
  isLocked: boolean;
  enforcePomodoro: boolean;
  onToggle: () => void;
}

function TaskRow({
  task,
  isCompleted,
  isLocked,
  enforcePomodoro,
  onToggle,
}: TaskRowProps) {
  // When enforcePomodoro is on, clicking the checkbox is disabled.
  // The only path to completion is via PomodoroTimer.onComplete → onToggle.
  const checkboxDisabled = isLocked || (enforcePomodoro && !isCompleted);

  return (
    <li
      className={`
        transition-colors duration-75
        ${isCompleted ? "bg-white" : isLocked ? "bg-black/80" : "bg-black"}
      `}
    >
      <div
        className={`
          flex items-start gap-4 p-4
          ${isLocked ? "opacity-40" : ""}
        `}
      >
        {/* Checkbox / lock indicator */}
        <button
          onClick={onToggle}
          disabled={checkboxDisabled}
          className={`
            flex-shrink-0 mt-0.5 w-5 h-5 border-2
            flex items-center justify-center text-xs font-bold
            transition-colors duration-75
            ${checkboxDisabled ? "cursor-not-allowed" : "cursor-pointer"}
            ${
              isCompleted
                ? "border-black bg-black text-white"
                : isLocked
                ? "border-white/20 bg-transparent"
                : "border-white bg-transparent hover:bg-white/10"
            }
          `}
          aria-pressed={isCompleted}
          aria-disabled={checkboxDisabled}
          aria-label={`${task.label} — ${isCompleted ? "completed" : isLocked ? "locked" : "incomplete"}`}
        >
          {isLocked ? (
            <Lock size={10} className="text-white/30" />
          ) : isCompleted ? (
            <span className="text-white">✓</span>
          ) : null}
        </button>

        {/* Task info + pomodoro */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`
                text-sm font-bold tracking-widest uppercase
                ${isCompleted ? "text-black line-through opacity-60" : "text-white"}
                ${isLocked ? "text-white/30" : ""}
              `}
            >
              {task.label}
            </span>
            <span
              className={`
                flex-shrink-0 text-xs tracking-widest font-mono
                ${isCompleted ? "text-black/50" : "text-white/40"}
              `}
            >
              {task.duration}
            </span>
          </div>

          <p
            className={`
              mt-0.5 text-xs tracking-wide
              ${isCompleted ? "text-black/40" : "text-white/30"}
            `}
          >
            {task.description}
          </p>

          {/* Enforcement hint */}
          {enforcePomodoro && !isCompleted && !isLocked && (
            <p className="mt-1 text-white/25 text-[10px] tracking-widest uppercase">
              TIMER REQUIRED TO COMPLETE
            </p>
          )}

          {/* Pomodoro timer — hidden when completed or locked */}
          {!isCompleted && !isLocked && (
            <PomodoroTimer
              taskId={task.id}
              pomoDurationMinutes={task.pomoDurationMinutes}
              isCompleted={isCompleted}
              onComplete={onToggle}
            />
          )}
        </div>
      </div>
    </li>
  );
}
