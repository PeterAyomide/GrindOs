/**
 * LockoutOverlay.tsx
 *
 * Full-screen brutalist overlay that gates dashboard access each discipline day.
 * Before initiating protocol, the user must:
 *   1. Rate their energy level (1–5)
 *   2. State their primary objective for the day
 *   3. Click "Initiate Protocol" — which logs timestamp + intent + mood
 */

"use client";

import { useState } from "react";
import { useGrindStore } from "@/store/useGrindStore";
import { useLiveClock } from "@/hooks/useLiveClock";
import { getDisciplineDay } from "@/lib/timeUtils";

const MOOD_LABELS: Record<number, string> = {
  1: "DEPLETED",
  2: "LOW",
  3: "NEUTRAL",
  4: "CHARGED",
  5: "PEAK",
};

export function LockoutOverlay() {
  const initiateProtocol = useGrindStore((s) => s.initiateProtocol);
  const clock = useLiveClock();
  const disciplineDay = getDisciplineDay();

  const [mood, setMood] = useState<number>(0);
  const [intent, setIntent] = useState<string>("");

  const canInitiate = mood > 0 && intent.trim().length > 0;

  function handleInitiate() {
    if (!canInitiate) return;
    initiateProtocol(intent.trim(), mood);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col font-mono select-none overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-label="GrindOS Protocol Initiation"
    >
      {/* Top bar */}
      <div className="border-b border-white p-4 flex justify-between text-xs text-white/60 tracking-widest uppercase flex-shrink-0">
        <span>GRINDOS v2.0</span>
        <span>{clock}</span>
        <span>DAY: {disciplineDay}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12 max-w-2xl mx-auto w-full">

        {/* ASCII logo */}
        <pre className="text-white text-[10px] leading-tight tracking-tight whitespace-pre opacity-30 hidden lg:block">
{`
 ██████╗ ██████╗ ██╗███╗   ██╗██████╗  ██████╗ ███████╗
██╔════╝ ██╔══██╗██║████╗  ██║██╔══██╗██╔═══██╗██╔════╝
██║  ███╗██████╔╝██║██╔██╗ ██║██║  ██║██║   ██║███████╗
██║   ██║██╔══██╗██║██║╚██╗██║██║  ██║██║   ██║╚════██║
╚██████╔╝██║  ██║██║██║ ╚████║██████╔╝╚██████╔╝███████║
 ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚══════╝`}
        </pre>
        <p className="block lg:hidden text-5xl font-bold text-white tracking-tighter">
          GRINDOS
        </p>

        {/* ── Step 1: Energy rating ─────────────────────────────────── */}
        <div className="w-full border border-white p-6 space-y-4">
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase">
            STEP 1 — ENERGY ASSESSMENT
          </p>
          <p className="text-white text-sm tracking-wide">
            Current energy level:
          </p>
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <button
                key={level}
                onClick={() => setMood(level)}
                className={`
                  py-4 border-2 font-bold text-sm tracking-widest
                  flex flex-col items-center gap-1
                  transition-colors duration-75
                  ${mood === level
                    ? "border-white bg-white text-black"
                    : "border-white/30 bg-black text-white/60 hover:border-white hover:text-white"
                  }
                `}
                aria-pressed={mood === level}
                aria-label={`Energy level ${level}: ${MOOD_LABELS[level]}`}
              >
                <span className="text-lg">{level}</span>
                <span className="text-[9px] tracking-widest">{MOOD_LABELS[level]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Step 2: Daily intent ──────────────────────────────────── */}
        <div className="w-full border border-white p-6 space-y-4">
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase">
            STEP 2 — PRIMARY OBJECTIVE
          </p>
          <p className="text-white text-sm tracking-wide">
            What is the singular most important thing you will accomplish today?
          </p>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="STATE YOUR OBJECTIVE..."
            maxLength={280}
            rows={3}
            className="
              w-full bg-black border border-white/40 text-white
              p-3 text-sm tracking-wide font-mono
              placeholder:text-white/20 placeholder:tracking-widest
              focus:outline-none focus:border-white
              resize-none
            "
            aria-label="Daily intent statement"
          />
          <p className="text-white/20 text-xs tracking-widest text-right">
            {intent.length}/280
          </p>
        </div>

        {/* ── Initiate button ───────────────────────────────────────── */}
        <div className="w-full space-y-3">
          <button
            onClick={handleInitiate}
            disabled={!canInitiate}
            className={`
              w-full border-2 py-6 px-12
              text-xl font-bold tracking-[0.3em] uppercase
              transition-colors duration-75
              ${canInitiate
                ? "border-white bg-black text-white hover:bg-white hover:text-black active:scale-[0.98] cursor-pointer"
                : "border-white/20 bg-black text-white/20 cursor-not-allowed"
              }
            `}
            aria-label="Initiate the discipline protocol"
            aria-disabled={!canInitiate}
          >
            INITIATE PROTOCOL
          </button>

          {!canInitiate && (
            <p className="text-white/30 text-xs tracking-widest uppercase text-center">
              {mood === 0 && intent.trim().length === 0
                ? "RATE ENERGY + STATE OBJECTIVE TO CONTINUE"
                : mood === 0
                ? "RATE YOUR ENERGY LEVEL TO CONTINUE"
                : "STATE YOUR OBJECTIVE TO CONTINUE"}
            </p>
          )}

          {canInitiate && (
            <p className="text-white/30 text-xs tracking-widest uppercase text-center">
              INITIATION WILL BE TIMESTAMPED — {clock}
            </p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white p-4 text-center flex-shrink-0">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          NO COMFORT. NO COMPROMISE. NO EXCEPTIONS.
        </p>
      </div>
    </div>
  );
}
