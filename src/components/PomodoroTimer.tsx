/**
 * PomodoroTimer.tsx
 *
 * Per-task countdown timer integrated into each TaskRow.
 *
 * States:
 *   idle       → "▶ START {duration}" button visible
 *   running    → live countdown + fill bar + "■ STOP" button
 *   done       → auto-checks task, reverts to idle
 *
 * When `enforcePomodoro` is true (set in TaskEditor/settings):
 *   - The task checkbox in TaskRow is disabled
 *   - The ONLY way to complete a task is to run + finish the timer
 *
 * Design: minimal inline strip. No modal, no full-screen overlay.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useGrindStore } from "@/store/useGrindStore";

interface PomodoroTimerProps {
  taskId: string;
  pomoDurationMinutes: number;
  isCompleted: boolean;
  /** Called when timer reaches zero — should check off the task */
  onComplete: () => void;
}

export function PomodoroTimer({
  taskId,
  pomoDurationMinutes,
  isCompleted,
  onComplete,
}: PomodoroTimerProps) {
  const activePomodoro = useGrindStore((s) => s.activePomodoro);
  const startPomodoro = useGrindStore((s) => s.startPomodoro);
  const stopPomodoro = useGrindStore((s) => s.stopPomodoro);

  const isThisTaskActive =
    activePomodoro !== null && activePomodoro.taskId === taskId;

  // Local ms remaining — drives the display. Synced from store endTime.
  const [msRemaining, setMsRemaining] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When this task's pomodoro becomes active, start the local interval
  useEffect(() => {
    if (!isThisTaskActive || !activePomodoro) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    function tick() {
      if (!activePomodoro) return;
      const remaining = activePomodoro.endTime - Date.now();

      if (remaining <= 0) {
        // Timer done — complete task BEFORE clearing pomodoro (store enforcePomodoro check order)
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setMsRemaining(0);
        onComplete();
        stopPomodoro();
        return;
      }

      setMsRemaining(remaining);
    }

    tick(); // run immediately
    intervalRef.current = setInterval(tick, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThisTaskActive, activePomodoro?.taskId]);

  // Don't render timer on completed tasks
  if (isCompleted) return null;

  // Some OTHER task is running — show a locked indicator
  const otherTaskRunning =
    activePomodoro !== null && activePomodoro.taskId !== taskId;

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (!isThisTaskActive) {
    return (
      <button
        onClick={() => {
          if (otherTaskRunning) return;
          const totalMs = pomoDurationMinutes * 60 * 1000;
          startPomodoro(taskId, Date.now() + totalMs, totalMs);
        }}
        disabled={otherTaskRunning}
        className={`
          mt-2 flex items-center gap-2
          border border-white/30 px-3 py-1.5
          text-xs tracking-widest uppercase font-mono
          transition-colors duration-75
          ${otherTaskRunning
            ? "text-white/20 border-white/10 cursor-not-allowed"
            : "text-white/50 hover:text-white hover:border-white cursor-pointer"
          }
        `}
        aria-label={`Start ${pomoDurationMinutes}-minute pomodoro for this task`}
      >
        <span>▶</span>
        <span>
          {otherTaskRunning ? "TIMER RUNNING" : `START ${pomoDurationMinutes}m`}
        </span>
      </button>
    );
  }

  // ── Running state ───────────────────────────────────────────────────────────
  const totalMs = activePomodoro.totalMs;
  const fillPercent = Math.max(
    0,
    Math.min(100, ((totalMs - msRemaining) / totalMs) * 100)
  );
  const secondsLeft = Math.ceil(msRemaining / 1000);
  const minutesDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secondsDisplay = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mt-2 space-y-1.5">
      {/* Progress fill bar */}
      <div className="h-1 bg-white/10 w-full relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-white transition-all duration-500"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-mono font-bold tabular-nums tracking-widest">
          {minutesDisplay}:{secondsDisplay}
        </span>
        <button
          onClick={() => {
            stopPomodoro();
            setMsRemaining(0);
          }}
          className="
            border border-white/40 px-3 py-1
            text-white/60 text-xs tracking-widest uppercase font-mono
            hover:border-terminal-red hover:text-terminal-red
            transition-colors duration-75 cursor-pointer
          "
          aria-label="Stop pomodoro timer"
        >
          ■ STOP
        </button>
      </div>
    </div>
  );
}
