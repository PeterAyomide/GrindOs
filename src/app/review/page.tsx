/**
 * review/page.tsx — Weekly Review Screen
 *
 * Shows a 2-week (14-day) heatmap of discipline day history.
 * Data comes from:
 *   - `dayHistory` — archived records from past resets
 *   - Live store state — for the current active discipline day
 *
 * Navigation back to dashboard via Link.
 */

"use client";

import Link from "next/link";
import { useGrindStore, TASK_DEFINITIONS } from "@/store/useGrindStore";
import { getDisciplineDay, getPreviousDisciplineDay } from "@/lib/timeUtils";
import { ArrowLeft } from "lucide-react";

const MOOD_LABELS: Record<number, string> = {
  0: "—",
  1: "DEPLETED",
  2: "LOW",
  3: "NEUTRAL",
  4: "CHARGED",
  5: "PEAK",
};

/** Compute an array of the last N discipline day strings, most recent first */
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  let current = getDisciplineDay();
  for (let i = 0; i < n; i++) {
    days.push(current);
    current = getPreviousDisciplineDay(current);
  }
  return days;
}

export default function ReviewPage() {
  const dayHistory = useGrindStore((s) => s.dayHistory);
  const tasks = useGrindStore((s) => s.tasks);
  const customTasks = useGrindStore((s) => s.customTasks);
  const customTaskCompletions = useGrindStore((s) => s.customTaskCompletions);
  const streak = useGrindStore((s) => s.streak);
  const failureHistory = useGrindStore((s) => s.failureHistory);
  const dailyMoods = useGrindStore((s) => s.dailyMoods);
  const dailyIntents = useGrindStore((s) => s.dailyIntents);

  const days = getLastNDays(14);
  const today = getDisciplineDay();

  // Compute live "today" stats
  const todayBuiltinDone = TASK_DEFINITIONS.filter((t) => tasks[t.id]).length;
  const todayCustomDone = customTasks.filter(
    (t) => customTaskCompletions[t.id]
  ).length;
  const todayTotal = TASK_DEFINITIONS.length + customTasks.length;
  const todayDone = todayBuiltinDone + todayCustomDone;
  const todayFailures = failureHistory.filter(
    (f) => f.disciplineDay === today
  ).length;

  // Consecutive streak breakdown for the 14 days
  const daysComplete = days.filter((d) => {
    if (d === today) return todayDone === todayTotal && todayTotal > 0;
    return dayHistory[d]?.complete ?? false;
  }).length;

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/50 hover:text-white text-xs tracking-widest uppercase transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={14} />
          DASHBOARD
        </Link>
        <h1 className="text-sm font-bold tracking-[0.4em] uppercase">
          WEEKLY REVIEW
        </h1>
        <div className="text-white/30 text-xs tracking-widest">
          STREAK: {streak}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* ── 14-day summary stats ──────────────────────────────────── */}
        <div className="grid grid-cols-3 border border-white/20">
          <StatCell label="DAYS TRACKED" value={String(days.length)} />
          <StatCell
            label="COMPLETE"
            value={`${daysComplete}/${days.length}`}
            highlight={daysComplete === days.length}
          />
          <StatCell label="ACTIVE STREAK" value={`${streak}d`} highlight={streak > 0} />
        </div>

        {/* ── Calendar heatmap ─────────────────────────────────────── */}
        <section>
          <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase mb-4">
            LAST 14 DISCIPLINE DAYS
          </p>

          <div className="grid grid-cols-7 gap-px bg-white/10">
            {days.map((day) => {
              const isToday = day === today;
              const record = dayHistory[day];

              // Build display data
              let complete = false;
              let tasksCompleted = 0;
              let totalTasksCount = todayTotal;
              let failures = 0;
              let mood = 0;
              let intent = "";
              let hasData = isToday || !!record;

              if (isToday) {
                complete = todayDone === todayTotal && todayTotal > 0;
                tasksCompleted = todayDone;
                failures = todayFailures;
                mood = dailyMoods[today] ?? 0;
                intent = dailyIntents[today] ?? "";
              } else if (record) {
                complete = record.complete;
                tasksCompleted = record.tasksCompleted;
                totalTasksCount = record.totalTasks;
                failures = record.failureCount;
                mood = record.mood;
                intent = record.intent;
              }

              return (
                <DayCell
                  key={day}
                  day={day}
                  isToday={isToday}
                  hasData={hasData}
                  complete={complete}
                  tasksCompleted={tasksCompleted}
                  totalTasks={totalTasksCount}
                  failures={failures}
                  mood={mood}
                  intent={intent}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4">
            <LegendItem color="bg-white" label="COMPLETE" />
            <LegendItem color="bg-white/20" label="INCOMPLETE" />
            <LegendItem color="bg-terminal-red/60" label="HAD FAILURES" />
            <LegendItem color="bg-black border border-white/10" label="NO DATA" />
          </div>
        </section>

        {/* ── Mood trend ───────────────────────────────────────────── */}
        <section>
          <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase mb-4">
            ENERGY TREND (14 DAYS)
          </p>
          <div className="flex items-end gap-2 h-24 border-b border-white/10">
            {days.slice().reverse().map((day) => {
              const isToday = day === today;
              const m = isToday
                ? (dailyMoods[today] ?? 0)
                : (dayHistory[day]?.mood ?? 0);
              const heightPercent = m > 0 ? (m / 5) * 100 : 0;

              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  title={`${day}: ${MOOD_LABELS[m]}`}
                >
                  <div
                    className={`w-full transition-all ${
                      m > 0 ? "bg-white" : "bg-white/10"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-white/20 text-[8px] font-mono">
                    {m > 0 ? m : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-white/15 text-[9px] tracking-widest">
            <span>{days[days.length - 1]}</span>
            <span>TODAY</span>
          </div>
        </section>

        {/* ── Failure breakdown ────────────────────────────────────── */}
        {failureHistory.length > 0 && (
          <section>
            <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase mb-4">
              FAILURE HISTORY (ALL TIME — {failureHistory.length} TOTAL)
            </p>
            <div className="border border-terminal-red/30 divide-y divide-terminal-red/10">
              {failureHistory
                .slice()
                .reverse()
                .slice(0, 10)
                .map((f, i) => (
                  <div key={f.timestamp} className="flex justify-between px-4 py-2">
                    <span className="text-terminal-red/50 text-xs font-mono">
                      #{String(failureHistory.length - i).padStart(3, "0")}
                    </span>
                    <span className="text-terminal-red/40 text-xs font-mono">
                      {f.disciplineDay}
                    </span>
                    <span className="text-terminal-red text-xs font-mono tabular-nums">
                      {new Date(f.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              {failureHistory.length > 10 && (
                <div className="px-4 py-2 text-terminal-red/30 text-[10px] tracking-widest uppercase text-right">
                  +{failureHistory.length - 10} MORE
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DayCellProps {
  day: string;
  isToday: boolean;
  hasData: boolean;
  complete: boolean;
  tasksCompleted: number;
  totalTasks: number;
  failures: number;
  mood: number;
  intent: string;
}

function DayCell({
  day,
  isToday,
  hasData,
  complete,
  tasksCompleted,
  totalTasks,
  failures,
  mood,
}: DayCellProps) {
  // Short date label: "22" or "22*"
  const dayNumber = day.split("-")[2];

  const bgClass = !hasData
    ? "bg-black"
    : complete && failures === 0
    ? "bg-white"
    : complete
    ? "bg-white/80"
    : failures > 0
    ? "bg-terminal-red/20"
    : "bg-white/10";

  const textClass =
    complete && failures === 0 ? "text-black" : "text-white";

  return (
    <div
      className={`
        relative p-2 min-h-[80px] flex flex-col justify-between
        ${bgClass}
        ${isToday ? "ring-2 ring-white ring-inset" : ""}
      `}
      title={`${day} — ${hasData ? `${tasksCompleted}/${totalTasks} tasks${failures > 0 ? `, ${failures} failure(s)` : ""}` : "No data"}`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`text-xs font-bold font-mono ${
            hasData ? textClass : "text-white/20"
          }`}
        >
          {dayNumber}
          {isToday && (
            <span className="text-[8px] ml-0.5 tracking-widest">TODAY</span>
          )}
        </span>

        {/* Failure dot */}
        {failures > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-red flex-shrink-0" />
        )}
      </div>

      {hasData && (
        <div className="space-y-0.5">
          <p
            className={`text-[9px] font-mono tracking-widest ${
              complete ? textClass + " opacity-60" : "text-white/30"
            }`}
          >
            {tasksCompleted}/{totalTasks}
          </p>
          {mood > 0 && (
            <p
              className={`text-[8px] font-mono ${
                complete ? textClass + " opacity-40" : "text-white/20"
              }`}
            >
              E:{mood}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 border-r border-white/10 last:border-r-0 ${
        highlight ? "bg-white/5" : ""
      }`}
    >
      <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-bold font-mono tabular-nums ${
          highlight ? "text-white" : "text-white/60"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${color}`} />
      <span className="text-white/30 text-[9px] tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}
