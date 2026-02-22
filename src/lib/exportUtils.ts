/**
 * exportUtils.ts
 *
 * Generates a plain-text accountability report for the current discipline day.
 * All data comes from the Zustand store snapshot passed in.
 * Returns a string — the caller handles the download.
 */

import {
  GrindState,
  TASK_DEFINITIONS,
  TaskId,
} from "@/store/useGrindStore";
import { getDisciplineDay, formatLocalTime } from "@/lib/timeUtils";

const MOOD_LABELS: Record<number, string> = {
  0: "NOT SET",
  1: "DEPLETED",
  2: "LOW",
  3: "NEUTRAL",
  4: "CHARGED",
  5: "PEAK",
};

export function generateDailyReport(state: GrindState): string {
  const disciplineDay = getDisciplineDay();
  const lines: string[] = [];

  const hr = "═".repeat(60);
  const divider = "─".repeat(60);

  // Header
  lines.push(hr);
  lines.push("  GRINDOS — DAILY ACCOUNTABILITY REPORT");
  lines.push(hr);
  lines.push("");
  lines.push(`  DISCIPLINE DAY : ${disciplineDay}`);
  lines.push(`  GENERATED AT  : ${new Date().toLocaleString()}`);
  lines.push(`  STREAK        : ${state.streak} consecutive days`);
  lines.push("");

  // Protocol
  lines.push(divider);
  lines.push("  PROTOCOL");
  lines.push(divider);
  lines.push(
    `  INITIATED AT  : ${formatLocalTime(state.protocolStartTime)}`
  );
  const mood = state.dailyMoods[disciplineDay] ?? 0;
  lines.push(
    `  ENERGY LEVEL  : ${mood}/5 — ${MOOD_LABELS[mood]}`
  );
  const intent = state.dailyIntents[disciplineDay] ?? "—";
  lines.push(`  OBJECTIVE     : ${intent}`);
  lines.push("");

  // Built-in tasks
  lines.push(divider);
  lines.push("  BUILT-IN TASKS");
  lines.push(divider);

  let builtinDone = 0;
  for (const task of TASK_DEFINITIONS) {
    const done = state.tasks[task.id as TaskId];
    const marker = done ? "[✓]" : "[ ]";
    lines.push(`  ${marker}  ${task.label.padEnd(30)} ${task.duration}`);
    if (done) builtinDone++;
  }
  lines.push("");

  // Custom tasks
  if (state.customTasks.length > 0) {
    lines.push(divider);
    lines.push("  CUSTOM TASKS");
    lines.push(divider);
    let customDone = 0;
    for (const task of state.customTasks) {
      const done = state.customTaskCompletions[task.id] ?? false;
      const marker = done ? "[✓]" : "[ ]";
      lines.push(`  ${marker}  ${task.label.padEnd(30)} ${task.duration}`);
      if (done) customDone++;
    }
    lines.push(
      `\n  CUSTOM: ${customDone}/${state.customTasks.length} completed`
    );
    lines.push("");
  }

  // Summary
  const totalTasks = TASK_DEFINITIONS.length + state.customTasks.length;
  const totalDone =
    builtinDone +
    state.customTasks.filter((t) => state.customTaskCompletions[t.id]).length;
  const allComplete = totalDone === totalTasks;

  lines.push(divider);
  lines.push("  SUMMARY");
  lines.push(divider);
  lines.push(`  TASKS COMPLETE : ${totalDone}/${totalTasks}`);
  lines.push(`  DAY STATUS     : ${allComplete ? "✓ COMPLETE" : "INCOMPLETE"}`);
  lines.push("");

  // Failure log
  const todayFailures = state.failureHistory.filter(
    (f) => f.disciplineDay === disciplineDay
  );

  lines.push(divider);
  lines.push("  FAILURE LOG");
  lines.push(divider);

  if (todayFailures.length === 0) {
    lines.push("  NO FAILURES LOGGED TODAY");
  } else {
    todayFailures.forEach((f, i) => {
      lines.push(
        `  FAILURE ${String(i + 1).padStart(2, "0")} : ${formatLocalTime(f.timestamp)}`
      );
    });
  }

  lines.push("");
  lines.push(hr);
  lines.push("  NO COMFORT. NO COMPROMISE. NO EXCEPTIONS.");
  lines.push(hr);
  lines.push("");

  return lines.join("\n");
}

/**
 * Triggers a browser download of the report as a .txt file.
 */
export function downloadReport(content: string, disciplineDay: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grindos-report-${disciplineDay}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
