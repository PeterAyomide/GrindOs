/**
 * WeightLog.tsx
 *
 * Biometric weight tracking panel.
 * Appends entries to an immutable time-series log in Zustand.
 * Displays the last 7 entries inline as a compact list.
 *
 * Unit toggle: kg ↔ lbs (stored per entry, not globally).
 */

"use client";

import { useState } from "react";
import { useGrindStore, WeightEntry } from "@/store/useGrindStore";
import { formatLocalTime } from "@/lib/timeUtils";

export function WeightLog() {
  const weightLog = useGrindStore((s) => s.weightLog);
  const logWeight = useGrindStore((s) => s.logWeight);

  const [value, setValue] = useState<string>("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [error, setError] = useState<string>("");

  function handleLog() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0 || num > 500) {
      setError("Enter a valid weight (1–500).");
      return;
    }
    logWeight(num, unit);
    setValue("");
    setError("");
  }

  const recent = [...weightLog].reverse().slice(0, 7);

  return (
    <div className="border-t border-white/20 p-4 space-y-4">
      <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase">
        BIOMETRIC LOG
      </p>

      {/* Input row */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={500}
            step={0.1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLog()}
            placeholder="0.0"
            className="
              flex-1 bg-black border border-white/30 text-white
              px-3 py-2 text-sm font-mono tracking-widest tabular-nums
              placeholder:text-white/20
              focus:outline-none focus:border-white
            "
            aria-label="Weight value"
          />

          {/* Unit toggle */}
          <button
            onClick={() => setUnit((u) => (u === "kg" ? "lbs" : "kg"))}
            className="
              px-3 border border-white/30 text-white/60
              text-xs font-mono tracking-widest uppercase
              hover:border-white hover:text-white
              transition-colors cursor-pointer flex-shrink-0
            "
            aria-label={`Switch unit, currently ${unit}`}
          >
            {unit}
          </button>

          <button
            onClick={handleLog}
            disabled={!value}
            className={`
              px-4 border text-xs font-mono tracking-widest uppercase font-bold
              transition-colors cursor-pointer flex-shrink-0
              ${value
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-white/20 text-white/20 cursor-not-allowed"
              }
            `}
            aria-label="Log weight entry"
          >
            LOG
          </button>
        </div>

        {error && (
          <p className="text-terminal-red text-[10px] tracking-widest uppercase">
            {error}
          </p>
        )}
      </div>

      {/* Recent entries */}
      {recent.length > 0 && (
        <div className="space-y-1">
          {recent.map((entry: WeightEntry, i) => (
            <div
              key={entry.timestamp}
              className="flex items-center justify-between py-1 border-b border-white/5"
            >
              <span className="text-white/40 text-[10px] font-mono tabular-nums tracking-widest">
                {formatLocalTime(entry.timestamp)}
              </span>
              <span
                className={`
                  text-xs font-mono font-bold tabular-nums tracking-wide
                  ${i === 0 ? "text-white" : "text-white/40"}
                `}
              >
                {entry.value.toFixed(1)} {entry.unit}
              </span>
            </div>
          ))}

          {weightLog.length > 7 && (
            <p className="text-white/20 text-[10px] tracking-widest uppercase text-right">
              +{weightLog.length - 7} MORE ENTRIES
            </p>
          )}
        </div>
      )}

      {recent.length === 0 && (
        <p className="text-white/15 text-[10px] tracking-widest uppercase">
          NO ENTRIES YET
        </p>
      )}
    </div>
  );
}
