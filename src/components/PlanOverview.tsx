"use client";

import { useEffect, useState } from "react";

const target = new Date("2026-11-20T00:00:00");

const plans = [
  [
    "MONDAY",
    "PUSH + CORE",
    "150m SRE",
    "Push-ups 4×8–15; pike push-ups 3×6–12; close-grip push-ups 3×8–12; plank 3×45s; dead bug 3×10/side.",
  ],
  [
    "TUESDAY",
    "LEGS + CONDITIONING",
    "150m SRE",
    "Squats 4×15; reverse lunges 3×10/leg; glute bridges 4×15; calf raises 4×20; mountain climbers 6×30s.",
  ],
  [
    "WEDNESDAY",
    "PULL / POSTURE + CORE",
    "150m SRE",
    "Prone Y-T-W raises 3×10 each; reverse snow angels 3×12; superman 3×12; bird dog 3×10/side; side plank 3×30s/side.",
  ],
  [
    "THURSDAY",
    "FULL BODY",
    "150m SRE",
    "Squats 3×15; push-ups 3×10; split squats 3×10/leg; pike push-ups 3×8; glute bridges 3×15; hollow hold 3×30s.",
  ],
  [
    "FRIDAY",
    "UPPER BODY + CORE",
    "150m SRE",
    "Push-ups 4×10; diamond push-ups 3×6–10; pike push-ups 3×8; shoulder taps 3×20; bicycle crunches 3×20; plank 3×45s.",
  ],
  [
    "SATURDAY",
    "MAIN FULL SESSION",
    "5h SRE BUILD",
    "Warm-up 5m; 4 rounds: 15 squats, 10 push-ups, 10 lunges/leg, 12 glute bridges, 30s plank; finish with 10m mobility. Add reps only with clean form.",
  ],
  [
    "SUNDAY",
    "REST + EASY WALK",
    "5h SRE REVIEW",
    "No strength session. Walk 20–40m, gently mobilize hips/shoulders, review the week, recover, and prepare Monday.",
  ],
] as const;

export function PlanOverview() {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      setDaysLeft(
        Math.max(
          0,
          Math.ceil((target.getTime() - Date.now()) / 86400000)
        )
      );
    };

    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const day = new Date().getDay();
  const currentPlanIndex = day === 0 ? 6 : day - 1;

  return (
    <section className="space-y-4 border-b border-white p-5">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            MISSION WINDOW
          </p>

          <p className="text-3xl font-bold tabular-nums">
            {daysLeft}{" "}
            <span className="text-sm text-white/40">DAYS LEFT</span>
          </p>

          <p className="text-xs uppercase tracking-widest text-white/40">
            Target: 20 Nov 2026
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            DAILY ANCHORS
          </p>

          <p className="text-sm">05:00 WAKE · 08:00–16:00 NYSC</p>
          <p className="text-sm">23:00 SLEEP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
        {plans.map(([dayName, workout, study, details], index) => (
          <div key={dayName}>
            <div
              className={`flex justify-between gap-3 border px-3 py-2 text-xs ${
                index === currentPlanIndex
                  ? "border-white text-white"
                  : "border-white/10 text-white/50"
              }`}
            >
              <span className="font-bold">{dayName}</span>
              <span className="font-bold">{workout}</span>
              <span className="text-right">{study}</span>
            </div>

            <p className="px-3 pb-2 text-[10px] leading-relaxed text-white/35">
              {details}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
