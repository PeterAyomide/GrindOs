/**
 * FailureButton.tsx
 *
 * The "Succumbed to Comfort" nuclear button.
 *
 * Behavior on press:
 *   1. Logs a failure event (timestamp + discipline day) to failureHistory
 *   2. Sets isFailureActive = true → entire UI turns red
 *   3. After 10s → isFailureActive = false → UI returns to normal
 *
 * The button is intentionally large, red-bordered, and prominent.
 * It should feel like pressing an alarm — not easy to ignore.
 *
 * Failure does NOT modify streak. Only an incomplete day at reset time does.
 */

"use client";

import { useGrindStore } from "@/store/useGrindStore";
import { useState } from "react";

export function FailureButton() {
  const triggerFailure = useGrindStore((s) => s.triggerFailure);
  const isFailureActive = useGrindStore((s) => s.isFailureActive);
  const failureHistory = useGrindStore((s) => s.failureHistory);

  // Local confirmation step — prevents accidental clicks
  const [confirmPending, setConfirmPending] = useState(false);

  function handleFirstClick() {
    setConfirmPending(true);
    // Auto-cancel confirmation after 5 seconds if not confirmed
    setTimeout(() => setConfirmPending(false), 5000);
  }

  function handleConfirm() {
    setConfirmPending(false);
    triggerFailure();
  }

  function handleCancel() {
    setConfirmPending(false);
  }

  const todayFailureCount = failureHistory.filter(
    // Count failures logged today (rough approximation by checking within 24h)
    (f) => Date.now() - new Date(f.timestamp).getTime() < 86_400_000
  ).length;

  if (confirmPending) {
    return (
      <div className="border-2 border-terminal-red p-6 space-y-4">
        <p className="text-terminal-red font-bold text-lg tracking-widest uppercase text-center">
          CONFIRM FAILURE?
        </p>
        <p className="text-white/60 text-xs tracking-wide text-center uppercase">
          This will be logged with a timestamp. Are you certain?
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleConfirm}
            className="
              flex-1 py-4
              bg-terminal-red text-black
              font-bold tracking-widest uppercase text-sm
              hover:opacity-90 active:scale-95
              transition-all duration-75
              border-2 border-terminal-red
            "
          >
            YES — LOG FAILURE
          </button>
          <button
            onClick={handleCancel}
            className="
              flex-1 py-4
              bg-black text-white
              font-bold tracking-widest uppercase text-sm
              hover:bg-white/10 active:scale-95
              transition-all duration-75
              border-2 border-white
            "
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleFirstClick}
        disabled={isFailureActive}
        className={`
          w-full
          border-2 border-terminal-red
          py-6 px-8
          font-bold text-xl tracking-[0.2em] uppercase
          transition-all duration-75
          ${isFailureActive
            ? "bg-terminal-red text-black cursor-not-allowed animate-failurePulse"
            : "bg-black text-terminal-red hover:bg-terminal-red hover:text-black active:scale-[0.99]"
          }
        `}
        aria-label="Log a comfort failure event"
        aria-disabled={isFailureActive}
      >
        {isFailureActive ? "FAILURE STATE ACTIVE" : "SUCCUMBED TO COMFORT"}
      </button>

      {/* Failure counter */}
      {todayFailureCount > 0 && (
        <p className="text-terminal-red/60 text-xs tracking-widest uppercase text-center">
          {todayFailureCount} FAILURE{todayFailureCount !== 1 ? "S" : ""} LOGGED TODAY
        </p>
      )}
    </div>
  );
}
