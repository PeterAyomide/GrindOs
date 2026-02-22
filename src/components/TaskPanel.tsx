/**
 * TaskPanel.tsx
 *
 * Renders a group of tasks for a single category (physical / cognitive / intellectual).
 * Each task is a binary toggle — completed or not.
 * No partial states. No timers. Click = done or undone.
 *
 * Design decisions:
 *   - Checkbox is faked via a styled div to enforce brutalist aesthetic
 *   - Completed tasks show a filled box + struck label
 *   - No hover effects on completed tasks (state is final-feeling)
 */

"use client";

import { TaskCategory, TaskDefinition, TaskId, useGrindStore } from "@/store/useGrindStore";

interface TaskPanelProps {
  category: TaskCategory;
  tasks: TaskDefinition[];
  /** Category label shown as section header */
  label: string;
}

export function TaskPanel({ category, tasks, label }: TaskPanelProps) {
  const taskState = useGrindStore((s) => s.tasks);
  const toggleTask = useGrindStore((s) => s.toggleTask);

  const completedCount = tasks.filter((t) => taskState[t.id]).length;
  const total = tasks.length;

  // Category accent color map — only white/red palette is used
  const categoryAccent: Record<TaskCategory, string> = {
    physical: "text-white",
    cognitive: "text-white",
    intellectual: "text-white",
  };

  return (
    <section className="border border-white">
      {/* Panel header */}
      <div className="border-b border-white p-3 flex justify-between items-center">
        <h2
          className={`text-xs font-bold tracking-[0.3em] uppercase ${categoryAccent[category]}`}
        >
          {label}
        </h2>
        <span className="text-xs text-white/50 font-mono tracking-widest">
          {completedCount}/{total}
        </span>
      </div>

      {/* Task list */}
      <ul className="divide-y divide-white/20">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isCompleted={taskState[task.id]}
            onToggle={() => toggleTask(task.id)}
          />
        ))}
      </ul>
    </section>
  );
}

// ─── TaskRow ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskDefinition;
  isCompleted: boolean;
  onToggle: () => void;
}

function TaskRow({ task, isCompleted, onToggle }: TaskRowProps) {
  return (
    <li>
      <button
        onClick={onToggle}
        className={`
          w-full text-left
          flex items-start gap-4
          p-4
          transition-colors duration-75
          ${isCompleted
            ? "bg-white text-black"
            : "bg-black text-white hover:bg-white/5"
          }
          focus:outline-none focus:ring-1 focus:ring-white focus:ring-inset
        `}
        aria-pressed={isCompleted}
        aria-label={`${task.label} — ${isCompleted ? "completed" : "incomplete"}`}
      >
        {/* Checkbox indicator */}
        <span
          className={`
            flex-shrink-0 mt-0.5
            w-5 h-5
            border-2
            flex items-center justify-center
            text-xs font-bold
            ${isCompleted
              ? "border-black bg-black text-white"
              : "border-white bg-transparent text-transparent"
            }
          `}
          aria-hidden="true"
        >
          ✓
        </span>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`
                text-sm font-bold tracking-widest uppercase
                ${isCompleted ? "line-through opacity-60" : ""}
              `}
            >
              {task.label}
            </span>
            <span
              className={`
                flex-shrink-0
                text-xs tracking-widest font-mono
                ${isCompleted ? "opacity-50" : "opacity-40"}
              `}
            >
              {task.duration}
            </span>
          </div>
          <p
            className={`
              mt-0.5 text-xs tracking-wide
              ${isCompleted ? "opacity-40" : "opacity-30"}
            `}
          >
            {task.description}
          </p>
        </div>
      </button>
    </li>
  );
}
