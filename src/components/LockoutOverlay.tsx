/**
 * LockoutOverlay.tsx
 *
 * Full-screen brutalist overlay that gates access to the dashboard.
 * Visible whenever `protocolStartTime` is null for the current discipline day.
 *
 * Clicking "Initiate Protocol" records the exact ISO timestamp and
 * dismisses the overlay, granting access to the dashboard.
 */

"use client";

import { useGrindStore } from "@/store/useGrindStore";
import { useLiveClock } from "@/hooks/useLiveClock";
import { getDisciplineDay } from "@/lib/timeUtils";

export function LockoutOverlay() {
  const initiateProtocol = useGrindStore((s) => s.initiateProtocol);
  const clock = useLiveClock();
  const disciplineDay = getDisciplineDay();

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black
        flex flex-col items-center justify-center
        font-mono
        select-none
      "
      aria-modal="true"
      role="dialog"
      aria-label="GrindOS Protocol Initiation"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 border-b border-white p-4 flex justify-between text-xs text-white/60 tracking-widest uppercase">
        <span>GRINDOS v1.0</span>
        <span>{clock}</span>
        <span>DAY: {disciplineDay}</span>
      </div>

      {/* Center block */}
      <div className="flex flex-col items-center gap-12 px-8 text-center">
        {/* ASCII-style header */}
        <div className="space-y-1">
          <pre className="text-white text-xs leading-tight tracking-tight whitespace-pre opacity-40 hidden sm:block">
{`
 ██████╗ ██████╗ ██╗███╗   ██╗██████╗  ██████╗ ███████╗
██╔════╝ ██╔══██╗██║████╗  ██║██╔══██╗██╔═══██╗██╔════╝
██║  ███╗██████╔╝██║██╔██╗ ██║██║  ██║██║   ██║███████╗
██║   ██║██╔══██╗██║██║╚██╗██║██║  ██║██║   ██║╚════██║
╚██████╔╝██║  ██║██║██║ ╚████║██████╔╝╚██████╔╝███████║
 ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚══════╝
`}
          </pre>
          <p className="block sm:hidden text-6xl font-bold text-white tracking-tighter">
            GRINDOS
          </p>
        </div>

        {/* Status line */}
        <div className="border border-white p-6 max-w-lg w-full">
          <p className="text-white text-xs tracking-widest uppercase mb-2 opacity-60">
            SYSTEM STATUS
          </p>
          <p className="text-white text-lg tracking-wide">
            DISCIPLINE DAY INITIATED
          </p>
          <p className="text-white/50 text-sm mt-2 tracking-widest">
            04:00 — 03:59 WINDOW ACTIVE
          </p>
        </div>

        {/* Warning block */}
        <div className="border border-white/30 p-4 max-w-lg w-full">
          <p className="text-white/70 text-sm tracking-wide leading-relaxed uppercase">
            You are about to begin your discipline protocol.
            <br />
            All tasks are mandatory. No partial credit.
            <br />
            The clock is already running.
          </p>
        </div>

        {/* Initiate button */}
        <button
          onClick={initiateProtocol}
          className="
            w-full max-w-lg
            border-2 border-white
            bg-black text-white
            py-6 px-12
            text-2xl font-bold tracking-[0.3em] uppercase
            hover:bg-white hover:text-black
            active:scale-[0.98]
            transition-colors duration-75
            cursor-pointer
          "
          aria-label="Initiate the discipline protocol for today"
        >
          INITIATE PROTOCOL
        </button>

        {/* Timestamp indicator */}
        <p className="text-white/30 text-xs tracking-widest uppercase">
          INITIATION WILL BE TIMESTAMPED — {clock}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white p-4 text-center">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          NO COMFORT. NO COMPROMISE. NO EXCEPTIONS.
        </p>
      </div>
    </div>
  );
}
