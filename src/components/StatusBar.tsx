/**
 * StatusBar.tsx
 *
 * Top navigation bar showing:
 *   - Current local time (live)
 *   - Current discipline day
 *   - Protocol start timestamp
 *   - Day completion status
 */

"use client";

import { useGrindStore } from "@/store/useGrindStore";
import { useLiveClock } from "@/hooks/useLiveClock";
import { getDisciplineDay, formatLocalTime } from "@/lib/timeUtils";

export function StatusBar() {
  const clock = useLiveClock();
  const protocolStartTime = useGrindStore((s) => s.protocolStartTime);
  const isDayComplete = useGrindStore((s) => s.isDayComplete());
  const disciplineDay = getDisciplineDay();

  return (
    <header className="border-b border-white">
      {/* Top line: branding + clock */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/20">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-lg tracking-[0.3em] uppercase">
            GRINDOS
          </span>
          <span className="text-white/30 text-xs tracking-widest">v1.0</span>
        </div>

        {/* Live clock — large and dominant */}
        <span
          className="text-white font-mono text-2xl font-bold tracking-widest tabular-nums"
          aria-live="polite"
          aria-label={`Current time: ${clock}`}
        >
          {clock || "00:00:00"}
        </span>
      </div>

      {/* Bottom line: meta info */}
      <div className="flex items-center justify-between px-6 py-2 text-xs font-mono tracking-widest">
        <div className="flex gap-6">
          <MetaItem label="DAY" value={disciplineDay} />
          <MetaItem
            label="PROTOCOL INITIATED"
            value={formatLocalTime(protocolStartTime)}
          />
        </div>

        <div className={isDayComplete ? "text-white" : "text-white/30"}>
          <span className="tracking-widest uppercase">
            {isDayComplete ? "✓ DAY COMPLETE" : "PROTOCOL ACTIVE"}
          </span>
        </div>
      </div>
    </header>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/30 uppercase">{label}:</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}
