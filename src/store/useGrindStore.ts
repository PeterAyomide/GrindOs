/**
 * store.ts — GrindOS Global State
 *
 * Architecture:
 *   - Single Zustand store with `persist` middleware → LocalStorage
 *   - `isFailureActive` is intentionally excluded from persistence (ephemeral UI flag)
 *   - All time-sensitive mutations are triggered externally (by useDailyReset hook)
 *     to keep the store pure and testable
 *   - Computed values (`isDayComplete`, `progressPercent`) are implemented as
 *     store-bound functions so they always read live state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getDisciplineDay } from "@/lib/timeUtils";

// ─── Task Identifiers ────────────────────────────────────────────────────────

export type TaskId =
  | "mobilityBlock1"
  | "mobilityBlock2"
  | "mobilityBlock3"
  | "deepWork1"
  | "deepWork2"
  | "deepWork3"
  | "deepWork4"
  | "reading20Pages";

/** Ordered list of all required tasks. Order determines render sequence. */
export const TASK_DEFINITIONS: TaskDefinition[] = [
  // ── Physical ────────────────────────────────────────
  {
    id: "mobilityBlock1",
    label: "MOBILITY BLOCK I",
    category: "physical",
    duration: "15m",
    description: "Joints, hip flexors, thoracic spine",
  },
  {
    id: "mobilityBlock2",
    label: "MOBILITY BLOCK II",
    category: "physical",
    duration: "15m",
    description: "Hamstrings, shoulders, active stretching",
  },
  {
    id: "mobilityBlock3",
    label: "MOBILITY BLOCK III",
    category: "physical",
    duration: "15m",
    description: "Full body flow integration",
  },
  // ── Cognitive ───────────────────────────────────────
  {
    id: "deepWork1",
    label: "DEEP WORK SESSION I",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
  },
  {
    id: "deepWork2",
    label: "DEEP WORK SESSION II",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
  },
  {
    id: "deepWork3",
    label: "DEEP WORK SESSION III",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
  },
  {
    id: "deepWork4",
    label: "DEEP WORK SESSION IV",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
  },
  // ── Intellectual ────────────────────────────────────
  {
    id: "reading20Pages",
    label: "READ 20 PAGES",
    category: "intellectual",
    duration: "—",
    description: "Non-fiction or technical material only",
  },
];

export type TaskCategory = "physical" | "cognitive" | "intellectual";

export interface TaskDefinition {
  id: TaskId;
  label: string;
  category: TaskCategory;
  duration: string;
  description: string;
}

/** Maps each TaskId to its completion boolean for the current discipline day */
export type TaskState = Record<TaskId, boolean>;

/** A single logged failure event */
export interface FailureEvent {
  /** ISO 8601 timestamp of when the button was pressed */
  timestamp: string;
  /** The discipline day this failure was logged on */
  disciplineDay: string;
}

// ─── Store Shape ─────────────────────────────────────────────────────────────

export interface GrindState {
  // ── Persisted state ──────────────────────────────────
  /** Binary completion state for each task. Resets each discipline day. */
  tasks: TaskState;

  /** Number of consecutive complete discipline days */
  streak: number;

  /**
   * The discipline day string (YYYY-MM-DD) currently loaded into the store.
   * Empty string on first ever run.
   * When getDisciplineDay() !== this value, a daily reset must occur.
   */
  lastResetDisciplineDay: string;

  /**
   * ISO timestamp of when the user clicked "Initiate Protocol" today.
   * Null if the lockout overlay has not been dismissed this discipline day.
   */
  protocolStartTime: string | null;

  /**
   * Append-only log of every failure event.
   * Failure does NOT automatically break streak — only incomplete days do.
   */
  failureHistory: FailureEvent[];

  // ── Ephemeral state (NOT persisted) ──────────────────
  /**
   * True for exactly 10 seconds after "Succumbed to Comfort" is pressed.
   * Drives the full-UI red state. Excluded from LocalStorage via partialize.
   */
  isFailureActive: boolean;

  // ── Actions ──────────────────────────────────────────

  /**
   * Called when the user clicks "Initiate Protocol" on the lockout overlay.
   * Records the exact local timestamp. Unlocks the dashboard.
   */
  initiateProtocol: () => void;

  /**
   * Toggles a single task's completion state.
   * Only callable when the protocol has been initiated (overlay dismissed).
   */
  toggleTask: (id: TaskId) => void;

  /**
   * Called by the "Succumbed to Comfort" button.
   * Logs the failure, activates the red UI, resets UI after 10s.
   * Does NOT modify streak or task state.
   */
  triggerFailure: () => void;

  /**
   * Called by the useDailyReset hook when it detects a new discipline day.
   * Evaluates whether the previous day was complete, then resets task state.
   *
   * @param currentDisciplineDay  The new discipline day string from getDisciplineDay()
   */
  performDailyReset: (currentDisciplineDay: string) => void;

  // ── Computed selectors ────────────────────────────────

  /** True if every task in TASK_DEFINITIONS is checked off */
  isDayComplete: () => boolean;

  /** 0–100 representing percentage of tasks completed today */
  progressPercent: () => number;
}

// ─── Initial State Values ────────────────────────────────────────────────────

/** All tasks start unchecked */
const initialTaskState: TaskState = {
  mobilityBlock1: false,
  mobilityBlock2: false,
  mobilityBlock3: false,
  deepWork1: false,
  deepWork2: false,
  deepWork3: false,
  deepWork4: false,
  reading20Pages: false,
};

// ─── Store Definition ────────────────────────────────────────────────────────

export const useGrindStore = create<GrindState>()(
  persist(
    (set, get) => ({
      // ── Initial persisted values ──────────────────────
      tasks: { ...initialTaskState },
      streak: 0,
      lastResetDisciplineDay: "", // empty → first run detected by hook
      protocolStartTime: null,
      failureHistory: [],

      // ── Ephemeral (non-persisted) ─────────────────────
      isFailureActive: false,

      // ── Actions ──────────────────────────────────────

      initiateProtocol: () => {
        set({ protocolStartTime: new Date().toISOString() });
      },

      toggleTask: (id: TaskId) => {
        const { tasks } = get();
        set({
          tasks: {
            ...tasks,
            [id]: !tasks[id],
          },
        });
      },

      triggerFailure: () => {
        const timestamp = new Date().toISOString();
        const disciplineDay = getDisciplineDay();

        set((state) => ({
          failureHistory: [
            ...state.failureHistory,
            { timestamp, disciplineDay },
          ],
          isFailureActive: true,
        }));

        // Auto-clear the failure UI state after exactly 10 seconds
        setTimeout(() => {
          set({ isFailureActive: false });
        }, 10_000);
      },

      performDailyReset: (currentDisciplineDay: string) => {
        const { tasks, streak, lastResetDisciplineDay } = get();

        // Guard: if the discipline day hasn't actually changed, do nothing.
        // This prevents accidental double-resets if the hook fires multiple times.
        if (lastResetDisciplineDay === currentDisciplineDay) return;

        // Evaluate completeness of the DAY BEING CLOSED OUT
        // (the tasks object still reflects yesterday's state at this point)
        const allTaskIds = TASK_DEFINITIONS.map((t) => t.id);
        const previousDayWasComplete = allTaskIds.every((id) => tasks[id]);

        const newStreak = previousDayWasComplete
          ? streak + 1
          : 0;

        set({
          tasks: { ...initialTaskState },
          streak: newStreak,
          lastResetDisciplineDay: currentDisciplineDay,
          // Clear protocol start — the lockout overlay must be dismissed again
          protocolStartTime: null,
        });
      },

      // ── Computed selectors ────────────────────────────

      isDayComplete: () => {
        const { tasks } = get();
        return TASK_DEFINITIONS.every((t) => tasks[t.id]);
      },

      progressPercent: () => {
        const { tasks } = get();
        const total = TASK_DEFINITIONS.length;
        const completed = TASK_DEFINITIONS.filter((t) => tasks[t.id]).length;
        // Guard against division by zero (should never happen but keeps TS happy)
        return total === 0 ? 0 : Math.round((completed / total) * 100);
      },
    }),

    {
      name: "grindos-state", // LocalStorage key
      storage: createJSONStorage(() => localStorage),

      /**
       * Exclude ephemeral UI state from persistence.
       * `isFailureActive` is transient — if the user closes the tab during
       * the 10-second window, it should NOT persist as true on next open.
       */
      partialize: (state) => ({
        tasks: state.tasks,
        streak: state.streak,
        lastResetDisciplineDay: state.lastResetDisciplineDay,
        protocolStartTime: state.protocolStartTime,
        failureHistory: state.failureHistory,
        // isFailureActive intentionally omitted
      }),
    }
  )
);
