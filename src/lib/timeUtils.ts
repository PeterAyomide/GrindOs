/**
 * timeUtils.ts
 *
 * All time logic lives here. The "discipline day" is NOT the calendar day —
 * it runs from 04:00 local time to 03:59:59 the next calendar day.
 *
 * Key invariant: getDisciplineDay() returns a stable string for any moment
 * within the same discipline window, and changes exactly at 04:00 local time.
 */

/** The hour at which the discipline day resets (local time). */
export const RESET_HOUR = 4;

/**
 * Returns an ISO date string (YYYY-MM-DD) representing the discipline day
 * that the given timestamp belongs to.
 *
 * Logic:
 *   - If local hour >= 04:00 → the discipline day is TODAY's calendar date.
 *   - If local hour <  04:00 → the discipline day is YESTERDAY's calendar date,
 *     because we are still inside the previous 04:00 window.
 *
 * Example:
 *   03:30 on 2026-02-10  → discipline day "2026-02-09" (still Feb 9th window)
 *   04:01 on 2026-02-10  → discipline day "2026-02-10" (Feb 10th window started)
 */
export function getDisciplineDay(date: Date = new Date()): string {
  const localHour = date.getHours();

  // Shift back one calendar day when we're in the 00:00–03:59 window
  const adjustedDate = new Date(date);
  if (localHour < RESET_HOUR) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }

  // Return YYYY-MM-DD using local date components (not UTC)
  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
  const day = String(adjustedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the previous discipline day string given a current discipline day.
 * Used during streak evaluation to check if yesterday was completed.
 */
export function getPreviousDisciplineDay(disciplineDay: string): string {
  const [year, month, day] = disciplineDay.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns milliseconds until the next 04:00 local time reset.
 * Used by the polling hook to schedule the next reset check.
 */
export function msUntilNextReset(): number {
  const now = new Date();
  const next = new Date(now);

  next.setSeconds(0, 0);
  next.setMinutes(0);
  next.setHours(RESET_HOUR);

  // If we've already passed today's 04:00, aim for tomorrow's
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

/**
 * Formats a Date or ISO string to HH:MM:SS in local time.
 * Used in the UI to display protocol start time and failure timestamps.
 */
export function formatLocalTime(isoString: string | null): string {
  if (!isoString) return "--:--:--";
  const date = new Date(isoString);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Returns a live clock string (HH:MM:SS) from a Date object.
 */
export function formatClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
