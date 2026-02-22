/**
 * ExportButton.tsx
 *
 * Single button that generates and downloads the daily accountability report as a .txt file.
 * Reads the full Zustand store state and delegates to exportUtils.
 */

"use client";

import { useState } from "react";
import { useGrindStore } from "@/store/useGrindStore";
import { generateDailyReport, downloadReport } from "@/lib/exportUtils";
import { getDisciplineDay } from "@/lib/timeUtils";
import { Download } from "lucide-react";

export function ExportButton() {
  const [exported, setExported] = useState(false);

  // Read the entire store state snapshot for the report
  const state = useGrindStore.getState;

  function handleExport() {
    const snap = state();
    const disciplineDay = getDisciplineDay();
    const report = generateDailyReport(snap);
    downloadReport(report, disciplineDay);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  return (
    <button
      onClick={handleExport}
      className="
        w-full flex items-center justify-center gap-3
        border border-white/30 py-3 px-4
        text-white/50 text-xs font-mono tracking-widest uppercase
        hover:border-white hover:text-white
        transition-colors duration-75 cursor-pointer
      "
      aria-label="Export today's accountability report as a text file"
    >
      <Download size={12} />
      {exported ? "REPORT DOWNLOADED" : "EXPORT DAILY REPORT"}
    </button>
  );
}
