/**
 * page.tsx — GrindOS Main Dashboard
 *
 * This is the single page of the app. All state lives in Zustand.
 *
 * Render flow:
 *   1. useDailyReset hook runs on mount, fires reset if discipline day changed
 *   2. If protocolStartTime is null → LockoutOverlay renders (full-screen gate)
 *   3. If isFailureActive → FailureOverlay renders on top of dashboard (z-40)
 *   4. Dashboard renders: StatusBar + task panels + streak + progress + failure btn
 *
 * Layout: 2-column grid on desktop, single column on mobile
 *   Left  (2/3): Task panels (physical, cognitive, intellectual)
 *   Right (1/3): Stats + failure controls
 *
 * "use client" is required because:
 *   - useDailyReset uses useEffect
 *   - All Zustand subscriptions are client-side
 *   - Live clock runs only in browser
 */

"use client";

import { useGrindStore, TASK_DEFINITIONS } from "@/store/useGrindStore";
import { useDailyReset } from "@/hooks/useDailyReset";

import { LockoutOverlay } from "@/components/LockoutOverlay";
import { FailureOverlay } from "@/components/FailureOverlay";
import { StatusBar } from "@/components/StatusBar";
import { TaskPanel } from "@/components/TaskPanel";
import { StreakDisplay } from "@/components/StreakDisplay";
import { ProgressBar } from "@/components/ProgressBar";
import { FailureButton } from "@/components/FailureButton";
import { FailureLog } from "@/components/FailureLog";

// Group task definitions by category for separate panel rendering
const physicalTasks = TASK_DEFINITIONS.filter((t) => t.category === "physical");
const cognitiveTasks = TASK_DEFINITIONS.filter((t) => t.category === "cognitive");
const intellectualTasks = TASK_DEFINITIONS.filter(
  (t) => t.category === "intellectual"
);

export default function GrindOSPage() {
  // ── Daily reset hook (must run on every render cycle) ──────────────────────
  useDailyReset();

  // ── Read gate-keeping state ────────────────────────────────────────────────
  const protocolStartTime = useGrindStore((s) => s.protocolStartTime);
  const isFailureActive = useGrindStore((s) => s.isFailureActive);
  const isDayComplete = useGrindStore((s) => s.isDayComplete());

  // ── Lockout: show overlay if protocol not yet initiated ────────────────────
  // Note: protocolStartTime is null on first visit each discipline day
  if (!protocolStartTime) {
    return <LockoutOverlay />;
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Full-screen red overlay for failure state — mounts on top of everything */}
      <FailureOverlay />

      {/*
        Root container:
        - Full viewport height
        - Flex column: StatusBar + scrollable main content
        - Failure active → subtle red tint on dashboard (overlay does the heavy work)
      */}
      <div
        className={`
          min-h-screen flex flex-col font-mono
          transition-colors duration-75
          ${isFailureActive ? "bg-black" : "bg-black"}
        `}
      >
        {/* ── Status bar ─────────────────────────────────────────────────── */}
        <StatusBar />

        {/* ── Main content area ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Day complete banner */}
          {isDayComplete && (
            <div className="border-b border-white bg-white text-black px-6 py-3 text-center">
              <p className="font-bold tracking-[0.4em] uppercase text-sm">
                ✓ ALL TASKS COMPLETE — DISCIPLINE DAY LOCKED IN
              </p>
            </div>
          )}

          {/* Grid layout: tasks left, stats right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-white">

            {/* ── LEFT: Task Panels (2 columns wide on lg) ─────────────── */}
            <div className="lg:col-span-2 border-r border-white/0 lg:border-white">
              {/* Physical tasks */}
              <div className="border-b border-white">
                <TaskPanel
                  category="physical"
                  tasks={physicalTasks}
                  label="PHYSICAL PROTOCOL"
                />
              </div>

              {/* Cognitive tasks */}
              <div className="border-b border-white">
                <TaskPanel
                  category="cognitive"
                  tasks={cognitiveTasks}
                  label="COGNITIVE PROTOCOL"
                />
              </div>

              {/* Intellectual tasks */}
              <TaskPanel
                category="intellectual"
                tasks={intellectualTasks}
                label="INTELLECTUAL PROTOCOL"
              />
            </div>

            {/* ── RIGHT: Stats + Controls ───────────────────────────────── */}
            <div className="border-t lg:border-t-0 border-white flex flex-col">

              {/* Streak counter */}
              <div className="border-b border-white">
                <StreakDisplay />
              </div>

              {/* Progress bar */}
              <div className="border-b border-white p-6">
                <ProgressBar />
              </div>

              {/* Failure button */}
              <div className="border-b border-white p-6">
                <FailureButton />
              </div>

              {/* Failure history log */}
              <div className="flex-1">
                <FailureLog />
              </div>
            </div>
          </div>

          {/* ── Footer: system info ───────────────────────────────────────── */}
          <footer className="px-6 py-4 flex justify-between text-white/20 text-xs tracking-widest uppercase">
            <span>GRINDOS v1.0 — ALL STATE LOCAL</span>
            <span>RESETS AT 04:00 LOCAL TIME</span>
          </footer>
        </main>
      </div>
    </>
  );
}
