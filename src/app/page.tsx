/**
 * page.tsx — GrindOS Main Dashboard (v2)
 *
 * New in v2:
 *   - Greeting component (Good morning / afternoon / evening, Peter)
 *   - Passes lockedTaskIds (ordering enforcement) to each TaskPanel
 *   - Passes correct completions map and onToggle to each TaskPanel
 *   - Custom task panel rendered after built-in panels
 *   - TaskEditor (settings + custom task management) at bottom of left panel
 *   - WeightLog + ExportButton in right panel
 *   - Weekly review link in footer
 */

"use client";

import Link from "next/link";
import {
  useGrindStore,
  TASK_DEFINITIONS,
  TaskId,
} from "@/store/useGrindStore";
import { useDailyReset } from "@/hooks/useDailyReset";

import { LockoutOverlay } from "@/components/LockoutOverlay";
import { FailureOverlay } from "@/components/FailureOverlay";
import { StatusBar } from "@/components/StatusBar";
import { TaskPanel } from "@/components/TaskPanel";
import { TaskEditor } from "@/components/TaskEditor";
import { StreakDisplay } from "@/components/StreakDisplay";
import { ProgressBar } from "@/components/ProgressBar";
import { FailureButton } from "@/components/FailureButton";
import { FailureLog } from "@/components/FailureLog";
import { Greeting } from "@/components/Greeting";
import { WeightLog } from "@/components/WeightLog";
import { ExportButton } from "@/components/ExportButton";

// Built-in task groups — static, defined once outside the component
const physicalTasks = TASK_DEFINITIONS.filter((t) => t.category === "physical");
const cognitiveTasks = TASK_DEFINITIONS.filter((t) => t.category === "cognitive");
const intellectualTasks = TASK_DEFINITIONS.filter(
  (t) => t.category === "intellectual"
);

export default function GrindOSPage() {
  // ── Daily reset (runs on mount + schedules future resets) ──────────────────
  useDailyReset();

  // ── Read state from store ──────────────────────────────────────────────────
  const protocolStartTime = useGrindStore((s) => s.protocolStartTime);
  const isFailureActive = useGrindStore((s) => s.isFailureActive);
  const isDayComplete = useGrindStore((s) => s.isDayComplete());

  // Built-in task completions
  const tasks = useGrindStore((s) => s.tasks);
  // Custom tasks
  const customTasks = useGrindStore((s) => s.customTasks);
  const customTaskCompletions = useGrindStore((s) => s.customTaskCompletions);

  // Actions
  const toggleTask = useGrindStore((s) => s.toggleTask);
  const toggleCustomTask = useGrindStore((s) => s.toggleCustomTask);

  // Computed: which tasks are locked (ordering enforcement)
  // IMPORTANT: call lockedTaskIds() OUTSIDE the selector so Zustand only
  // subscribes to the stable function reference, not the new Set it returns.
  // Calling it inside the selector returns a new Set every time → infinite loop.
  const getLockedTaskIds = useGrindStore((s) => s.lockedTaskIds);
  const lockedTaskIds = getLockedTaskIds();

  // ── Lockout gate ───────────────────────────────────────────────────────────
  if (!protocolStartTime) {
    return <LockoutOverlay />;
  }

  // ── Shared completions maps for TaskPanel ──────────────────────────────────
  // TaskPanel receives a plain Record<string, boolean> for its task list
  const builtinCompletions = tasks as Record<string, boolean>;

  // Custom tasks grouped by category
  const customPhysical = customTasks.filter((t) => t.category === "physical");
  const customCognitive = customTasks.filter((t) => t.category === "cognitive");
  const customIntellectual = customTasks.filter((t) => t.category === "intellectual");

  // Custom tasks that don't fit a category (shouldn't happen, but defensive)
  const customOther = customTasks.filter(
    (t) =>
      !["physical", "cognitive", "intellectual"].includes(t.category)
  );

  // Merge custom tasks into their respective category panels
  const physicalAll = [...physicalTasks, ...customPhysical];
  const cognitiveAll = [...cognitiveTasks, ...customCognitive];
  const intellectualAll = [...intellectualTasks, ...customIntellectual];

  // onToggle for each row: built-in TaskId vs custom id
  function handleToggle(id: string) {
    const isBuiltin = TASK_DEFINITIONS.some((t) => t.id === id);
    if (isBuiltin) {
      toggleTask(id as TaskId);
    } else {
      toggleCustomTask(id);
    }
  }

  // Merged completions: built-in + custom in one map
  const allCompletions: Record<string, boolean> = {
    ...builtinCompletions,
    ...customTaskCompletions,
  };

  return (
    <>
      {/* Full-screen failure overlay (z-40, pointer-events: none) */}
      <FailureOverlay />

      <div className="min-h-screen flex flex-col font-mono bg-black">
        {/* ── Status bar ────────────────────────────────────────────── */}
        <StatusBar />

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <Greeting />

        {/* ── Main content ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">

          {/* Day complete banner */}
          {isDayComplete && (
            <div className="border-b border-white bg-white text-black px-6 py-3 text-center">
              <p className="font-bold tracking-[0.4em] uppercase text-sm">
                ✓ ALL TASKS COMPLETE — DISCIPLINE DAY LOCKED IN
              </p>
            </div>
          )}

          {/* 3-column grid on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 border-b border-white">

            {/* ── LEFT: Task panels (2/3 width) ──────────────────────── */}
            <div className="lg:col-span-2 border-r-0 lg:border-r border-white flex flex-col">

              {/* Physical */}
              {physicalAll.length > 0 && (
                <div className="border-b border-white">
                  <TaskPanel
                    category="physical"
                    tasks={physicalAll}
                    label="PHYSICAL PROTOCOL"
                    lockedTaskIds={lockedTaskIds}
                    onToggle={handleToggle}
                    completions={allCompletions}
                  />
                </div>
              )}

              {/* Cognitive */}
              {cognitiveAll.length > 0 && (
                <div className="border-b border-white">
                  <TaskPanel
                    category="cognitive"
                    tasks={cognitiveAll}
                    label="COGNITIVE PROTOCOL"
                    lockedTaskIds={lockedTaskIds}
                    onToggle={handleToggle}
                    completions={allCompletions}
                  />
                </div>
              )}

              {/* Intellectual */}
              {intellectualAll.length > 0 && (
                <div className={customOther.length > 0 ? "border-b border-white" : ""}>
                  <TaskPanel
                    category="intellectual"
                    tasks={intellectualAll}
                    label="INTELLECTUAL PROTOCOL"
                    lockedTaskIds={lockedTaskIds}
                    onToggle={handleToggle}
                    completions={allCompletions}
                  />
                </div>
              )}

              {/* Uncategorized custom tasks (edge case) */}
              {customOther.length > 0 && (
                <TaskPanel
                  category="cognitive"
                  tasks={customOther}
                  label="ADDITIONAL TASKS"
                  lockedTaskIds={lockedTaskIds}
                  onToggle={handleToggle}
                  completions={allCompletions}
                />
              )}

              {/* Task editor + settings (always at bottom of left column) */}
              <div className="mt-auto border-t border-white/20">
                <TaskEditor />
              </div>
            </div>

            {/* ── RIGHT: Stats + controls (1/3 width) ────────────────── */}
            <div className="border-t lg:border-t-0 border-white flex flex-col">

              {/* Streak */}
              <div className="border-b border-white">
                <StreakDisplay />
              </div>

              {/* Progress */}
              <div className="border-b border-white p-5">
                <ProgressBar />
              </div>

              {/* Failure button */}
              <div className="border-b border-white p-5">
                <FailureButton />
              </div>

              {/* Weight log */}
              <div className="border-b border-white">
                <WeightLog />
              </div>

              {/* Export */}
              <div className="border-b border-white p-4">
                <ExportButton />
              </div>

              {/* Failure log */}
              <div className="flex-1">
                <FailureLog />
              </div>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <footer className="px-6 py-4 flex items-center justify-between text-white/20 text-xs tracking-widest uppercase">
            <span>GRINDOS v2.0 — ALL STATE LOCAL</span>
            <Link
              href="/review"
              className="text-white/30 hover:text-white tracking-widest uppercase text-xs transition-colors"
              aria-label="Open weekly review"
            >
              WEEKLY REVIEW →
            </Link>
            <span>RESETS AT 04:00</span>
          </footer>
        </main>
      </div>
    </>
  );
}
