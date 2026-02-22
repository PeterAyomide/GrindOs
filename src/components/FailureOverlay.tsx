/**
 * FailureOverlay.tsx
 *
 * A full-screen red overlay that activates for exactly 10 seconds after
 * "Succumbed to Comfort" is pressed. It overlays ALL content including
 * the dashboard, creating an unavoidable visual penalty.
 *
 * It does NOT block interaction — the user can still click tasks underneath
 * (via pointer-events: none) — but the visual impact is total.
 *
 * After 10 seconds, the store's triggerFailure action automatically
 * sets isFailureActive back to false, and this overlay unmounts.
 */

"use client";

import { useEffect, useState } from "react";
import { useGrindStore } from "@/store/useGrindStore";

export function FailureOverlay() {
  const isFailureActive = useGrindStore((s) => s.isFailureActive);
  const [countdown, setCountdown] = useState(10);

  // Countdown timer — resets when overlay activates
  useEffect(() => {
    if (!isFailureActive) {
      setCountdown(10);
      return;
    }

    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFailureActive]);

  if (!isFailureActive) return null;

  return (
    <div
      className="
        fixed inset-0 z-40
        bg-terminal-red
        flex flex-col items-center justify-center
        pointer-events-none
        font-mono
        animate-failurePulse
      "
      aria-live="assertive"
      role="alert"
      aria-label="Failure state active"
    >
      {/* Main failure text */}
      <div className="text-center space-y-6 px-8">
        <p className="text-black text-xs tracking-[0.5em] uppercase opacity-70">
          FAILURE LOGGED
        </p>

        <p className="text-black text-6xl sm:text-8xl font-bold tracking-tighter leading-none">
          COMFORT
          <br />
          WINS
        </p>

        <p className="text-black text-xs tracking-[0.4em] uppercase opacity-70">
          TIMESTAMP RECORDED
        </p>

        {/* Countdown */}
        <div className="border-2 border-black px-8 py-4 inline-block">
          <p className="text-black text-4xl font-bold font-mono tabular-nums">
            00:{String(countdown).padStart(2, "0")}
          </p>
          <p className="text-black text-xs tracking-widest uppercase opacity-60 mt-1">
            RESUMING PROTOCOL
          </p>
        </div>
      </div>

      {/* Grid overlay for texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 40px)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
