/**
 * store.ts — GrindOS Global State (v2)
 *
 * New in v2:
 *   - Custom tasks (user-defined, add/remove from UI)
 *   - Daily intent & mood logged at protocol initiation
 *   - Historical day records (for weekly review)
 *   - Pomodoro timer state (ephemeral)
 *   - Biometric weight log
 *   - Task ordering enforcement
 *   - Pomodoro enforcement
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getDisciplineDay } from "@/lib/timeUtils";

// ─── Task Identifiers ─────────────────────────────────────────────────────────

export type TaskId =
  | "mobilityBlock1"
  | "mobilityBlock2"
  | "mobilityBlock3"
  | "deepWork1"
  | "deepWork2"
  | "deepWork3"
  | "deepWork4"
  | "reading20Pages";

export type TaskCategory = "physical" | "cognitive" | "intellectual";

export interface TaskDefinition {
  id: TaskId;
  label: string;
  category: TaskCategory;
  duration: string;
  description: string;
  /** Default pomodoro duration in minutes */
  pomoDurationMinutes: number;
}

/** User-created tasks stored in the Zustand store */
export interface CustomTask {
  id: string;
  label: string;
  category: TaskCategory;
  duration: string;
  description: string;
  pomoDurationMinutes: number;
}

/** A single logged failure event */
export interface FailureEvent {
  timestamp: string;
  disciplineDay: string;
}

/** Biometric weight entry */
export interface WeightEntry {
  timestamp: string;
  value: number;
  unit: "kg" | "lbs";
}

/**
 * Snapshot of a completed/missed discipline day — persisted for weekly review.
 * Archived automatically at each 04:00 reset.
 */
export interface DayRecord {
  disciplineDay: string;
  complete: boolean;
  tasksCompleted: number;
  totalTasks: number;
  failureCount: number;
  /** User's intent statement for that day */
  intent: string;
  /** Energy level 1–5 (0 = not set) */
  mood: number;
}

/** Ephemeral pomodoro timer state — NOT persisted */
export interface ActivePomodoro {
  taskId: string;
  /** Unix timestamp when the timer ends */
  endTime: number;
  /** Total duration in ms (used to compute fill % in UI) */
  totalMs: number;
}

/** Maps built-in TaskId → boolean completion */
export type TaskState = Record<TaskId, boolean>;

// ─── Built-in Task Definitions ────────────────────────────────────────────────

export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: "mobilityBlock1",
    label: "MOBILITY BLOCK I",
    category: "physical",
    duration: "15m",
    description: "Joints, hip flexors, thoracic spine",
    pomoDurationMinutes: 15,
  },
  {
    id: "mobilityBlock2",
    label: "MOBILITY BLOCK II",
    category: "physical",
    duration: "15m",
    description: "Hamstrings, shoulders, active stretching",
    pomoDurationMinutes: 15,
  },
  {
    id: "mobilityBlock3",
    label: "MOBILITY BLOCK III",
    category: "physical",
    duration: "15m",
    description: "Full body flow integration",
    pomoDurationMinutes: 15,
  },
  {
    id: "deepWork1",
    label: "DEEP WORK SESSION I",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
    pomoDurationMinutes: 60,
  },
  {
    id: "deepWork2",
    label: "DEEP WORK SESSION II",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
    pomoDurationMinutes: 60,
  },
  {
    id: "deepWork3",
    label: "DEEP WORK SESSION III",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
    pomoDurationMinutes: 60,
  },
  {
    id: "deepWork4",
    label: "DEEP WORK SESSION IV",
    category: "cognitive",
    duration: "60m",
    description: "High-priority singular focus block",
    pomoDurationMinutes: 60,
  },
  {
    id: "reading20Pages",
    label: "READ 20 PAGES",
    category: "intellectual",
    duration: "—",
    description: "Non-fiction or technical material only",
    pomoDurationMinutes: 30,
  },
];

// ─── Store Shape ──────────────────────────────────────────────────────────────

export interface GrindState {
  // ── Persisted ─────────────────────────────────────────
  tasks: TaskState;
  /** User-defined tasks appended after built-ins */
  customTasks: CustomTask[];
  /** Completion state for custom tasks, keyed by CustomTask.id */
  customTaskCompletions: Record<string, boolean>;
  streak: number;
  lastResetDisciplineDay: string;
  /** ISO timestamp of protocol initiation; null = lockout active */
  protocolStartTime: string | null;
  failureHistory: FailureEvent[];
  /** Intent statement per discipline day (YYYY-MM-DD key) */
  dailyIntents: Record<string, string>;
  /** Energy/mood rating 1–5 per discipline day (0 = not set) */
  dailyMoods: Record<string, number>;
  /** Append-only weight log */
  weightLog: WeightEntry[];
  /** Historical day records archived at each 04:00 reset */
  dayHistory: Record<string, DayRecord>;
  /** If true, task N+1 is locked until task N is complete */
  enforceTaskOrder: boolean;
  /** If true, tasks can only be checked by running the pomodoro timer */
  enforcePomodoro: boolean;

  // ── Ephemeral (NOT persisted) ──────────────────────────
  isFailureActive: boolean;
  activePomodoro: ActivePomodoro | null;

  // ── Actions ───────────────────────────────────────────
  /** Updated signature: accepts intent + mood captured at lockout overlay */
  initiateProtocol: (intent: string, mood: number) => void;
  toggleTask: (id: TaskId) => void;
  toggleCustomTask: (id: string) => void;
  addCustomTask: (def: Omit<CustomTask, "id">) => void;
  removeCustomTask: (id: string) => void;
  triggerFailure: () => void;
  performDailyReset: (currentDisciplineDay: string) => void;
  logWeight: (value: number, unit: "kg" | "lbs") => void;
  startPomodoro: (taskId: string, endTime: number, totalMs: number) => void;
  stopPomodoro: () => void;
  toggleEnforceTaskOrder: () => void;
  toggleEnforcePomodoro: () => void;

  // ── Computed selectors ─────────────────────────────────
  isDayComplete: () => boolean;
  progressPercent: () => number;
  /** Returns the set of task IDs that are locked due to ordering enforcement */
  lockedTaskIds: () => Set<string>;
}

// ─── Initial values ───────────────────────────────────────────────────────────

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

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGrindStore = create<GrindState>()(
  persist(
    (set, get) => ({
      // ── Initial persisted state ────────────────────────
      tasks: { ...initialTaskState },
      customTasks: [],
      customTaskCompletions: {},
      streak: 0,
      lastResetDisciplineDay: "",
      protocolStartTime: null,
      failureHistory: [],
      dailyIntents: {},
      dailyMoods: {},
      weightLog: [],
      dayHistory: {},
      enforceTaskOrder: false,
      enforcePomodoro: false,

      // ── Ephemeral ──────────────────────────────────────
      isFailureActive: false,
      activePomodoro: null,

      // ── Actions ───────────────────────────────────────

      initiateProtocol: (intent: string, mood: number) => {
        const disciplineDay = getDisciplineDay();
        set((state) => ({
          protocolStartTime: new Date().toISOString(),
          dailyIntents: { ...state.dailyIntents, [disciplineDay]: intent },
          dailyMoods: { ...state.dailyMoods, [disciplineDay]: mood },
        }));
      },

      toggleTask: (id: TaskId) => {
        const { tasks, enforcePomodoro, activePomodoro } = get();
        // If pomodoro enforcement is on, only allow completion via pomodoro
        if (enforcePomodoro && !tasks[id]) {
          // Only allow manual toggle if this task just finished a pomodoro
          if (!activePomodoro || activePomodoro.taskId !== id) return;
        }
        set({ tasks: { ...tasks, [id]: !tasks[id] } });
      },

      toggleCustomTask: (id: string) => {
        const { customTaskCompletions, enforcePomodoro, activePomodoro } = get();
        if (enforcePomodoro && !customTaskCompletions[id]) {
          if (!activePomodoro || activePomodoro.taskId !== id) return;
        }
        set({
          customTaskCompletions: {
            ...customTaskCompletions,
            [id]: !customTaskCompletions[id],
          },
        });
      },

      addCustomTask: (def: Omit<CustomTask, "id">) => {
        const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
          customTasks: [...state.customTasks, { ...def, id }],
        }));
      },

      removeCustomTask: (id: string) => {
        set((state) => {
          const completions = { ...state.customTaskCompletions };
          delete completions[id];
          return {
            customTasks: state.customTasks.filter((t) => t.id !== id),
            customTaskCompletions: completions,
          };
        });
      },

      triggerFailure: () => {
        const timestamp = new Date().toISOString();
        const disciplineDay = getDisciplineDay();
        set((state) => ({
          failureHistory: [...state.failureHistory, { timestamp, disciplineDay }],
          isFailureActive: true,
        }));
        setTimeout(() => set({ isFailureActive: false }), 10_000);
      },

      performDailyReset: (currentDisciplineDay: string) => {
        const state = get();
        if (state.lastResetDisciplineDay === currentDisciplineDay) return;

        // ── Archive the day being closed ─────────────────
        const allBuiltinComplete = TASK_DEFINITIONS.every(
          (t) => state.tasks[t.id]
        );
        const allCustomComplete =
          state.customTasks.length === 0 ||
          state.customTasks.every((t) => state.customTaskCompletions[t.id]);
        const dayWasComplete = allBuiltinComplete && allCustomComplete;

        const builtinDoneCount = TASK_DEFINITIONS.filter(
          (t) => state.tasks[t.id]
        ).length;
        const customDoneCount = state.customTasks.filter(
          (t) => state.customTaskCompletions[t.id]
        ).length;
        const totalTasks =
          TASK_DEFINITIONS.length + state.customTasks.length;

        const closingDay = state.lastResetDisciplineDay;
        const newDayHistory = { ...state.dayHistory };

        // Only archive if there WAS a previous day (not the very first run)
        if (closingDay !== "") {
          newDayHistory[closingDay] = {
            disciplineDay: closingDay,
            complete: dayWasComplete,
            tasksCompleted: builtinDoneCount + customDoneCount,
            totalTasks,
            failureCount: state.failureHistory.filter(
              (f) => f.disciplineDay === closingDay
            ).length,
            intent: state.dailyIntents[closingDay] ?? "",
            mood: state.dailyMoods[closingDay] ?? 0,
          };
        }

        const newStreak =
          closingDay !== "" && dayWasComplete ? state.streak + 1 : 0;

        set({
          tasks: { ...initialTaskState },
          customTaskCompletions: {},
          streak: newStreak,
          lastResetDisciplineDay: currentDisciplineDay,
          protocolStartTime: null,
          activePomodoro: null,
          dayHistory: newDayHistory,
        });
      },

      logWeight: (value: number, unit: "kg" | "lbs") => {
        set((state) => ({
          weightLog: [
            ...state.weightLog,
            { timestamp: new Date().toISOString(), value, unit },
          ],
        }));
      },

      startPomodoro: (taskId: string, endTime: number, totalMs: number) => {
        set({ activePomodoro: { taskId, endTime, totalMs } });
      },

      stopPomodoro: () => {
        set({ activePomodoro: null });
      },

      toggleEnforceTaskOrder: () => {
        set((state) => ({ enforceTaskOrder: !state.enforceTaskOrder }));
      },

      toggleEnforcePomodoro: () => {
        set((state) => ({ enforcePomodoro: !state.enforcePomodoro }));
      },

      // ── Computed selectors ─────────────────────────────

      isDayComplete: () => {
        const { tasks, customTasks, customTaskCompletions } = get();
        const builtinDone = TASK_DEFINITIONS.every((t) => tasks[t.id]);
        const customDone =
          customTasks.length === 0 ||
          customTasks.every((t) => customTaskCompletions[t.id]);
        return builtinDone && customDone;
      },

      progressPercent: () => {
        const { tasks, customTasks, customTaskCompletions } = get();
        const total = TASK_DEFINITIONS.length + customTasks.length;
        if (total === 0) return 0;
        const done =
          TASK_DEFINITIONS.filter((t) => tasks[t.id]).length +
          customTasks.filter((t) => customTaskCompletions[t.id]).length;
        return Math.round((done / total) * 100);
      },

      lockedTaskIds: () => {
        const { tasks, customTasks, customTaskCompletions, enforceTaskOrder } =
          get();
        if (!enforceTaskOrder) return new Set<string>();

        // Combined ordered list: built-ins first, then custom
        const allIds: string[] = [
          ...TASK_DEFINITIONS.map((t) => t.id),
          ...customTasks.map((t) => t.id),
        ];

        const locked = new Set<string>();
        let foundIncomplete = false;

        for (const id of allIds) {
          if (foundIncomplete) {
            locked.add(id);
          }
          const isBuiltin = TASK_DEFINITIONS.some((t) => t.id === id);
          const complete = isBuiltin
            ? tasks[id as TaskId]
            : (customTaskCompletions[id] ?? false);
          if (!complete) foundIncomplete = true;
        }

        return locked;
      },
    }),

    {
      name: "grindos-state-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        customTasks: state.customTasks,
        customTaskCompletions: state.customTaskCompletions,
        streak: state.streak,
        lastResetDisciplineDay: state.lastResetDisciplineDay,
        protocolStartTime: state.protocolStartTime,
        failureHistory: state.failureHistory,
        dailyIntents: state.dailyIntents,
        dailyMoods: state.dailyMoods,
        weightLog: state.weightLog,
        dayHistory: state.dayHistory,
        enforceTaskOrder: state.enforceTaskOrder,
        enforcePomodoro: state.enforcePomodoro,
        // isFailureActive and activePomodoro intentionally omitted
      }),
    }
  )
);
