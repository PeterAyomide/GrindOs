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
  | "workout" | "mobility" | "sreWeekday" | "sreWeekend" | "nysc" | "reading" | "sleep";

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
  { id: "workout", label: "MORNING WORKOUT", category: "physical", duration: "05:10–05:55", description: "Follow today’s exact session: 5m warm-up, 30m strength/conditioning, 5–10m core or finisher. Monday push + core; Tuesday legs; Wednesday pull/posture + core; Thursday full body; Friday upper body + core; Saturday full session; Sunday rest and easy walk.", pomoDurationMinutes: 45 },
  { id: "mobility", label: "MOBILITY + COOL DOWN", category: "physical", duration: "10m", description: "2 rounds: 30s child’s pose, 30s cobra, 30s hip-flexor stretch per side, 30s hamstring stretch per side, 10 shoulder circles each way, 5 slow breaths. Finish hydrated.", pomoDurationMinutes: 10 },
  { id: "sreWeekday", label: "SRE STUDY — 150 MIN", category: "cognitive", duration: "19:00–21:30", description: "Three 50-minute blocks: Block 1 read and explain one concept without AI; Block 2 perform a hands-on Linux/networking/Go experiment; Block 3 document results, errors, commands and a short post-mortem. Take 10-minute breaks between blocks.", pomoDurationMinutes: 50 },
  { id: "sreWeekend", label: "SRE DEEP BUILD — 5 HOURS", category: "cognitive", duration: "5h", description: "Five 50-minute blocks with 10-minute breaks: 1) plan the build, 2) implement, 3) troubleshoot, 4) test and automate, 5) write documentation and a post-mortem. Produce a tangible artifact every weekend.", pomoDurationMinutes: 50 },
  { id: "nysc", label: "NYSC DUTY", category: "cognitive", duration: "08:00–16:00", description: "Arrive early, complete assigned duties, remain professional, record useful observations, avoid unnecessary distractions, and protect the evening SRE study block. Mark complete only after duty ends.", pomoDurationMinutes: 60 },
  { id: "reading", label: "TECHNICAL READING", category: "intellectual", duration: "20m", description: "Read official documentation or a serious technical chapter. Write 5 bullet notes, define 3 unfamiliar terms, and explain the main idea in your own words without copying AI output.", pomoDurationMinutes: 20 },
  { id: "sleep", label: "SHUTDOWN + SLEEP TARGET", category: "intellectual", duration: "23:00–05:00", description: "At 22:30 stop screens and work, prepare clothes and study materials, review tomorrow’s top 3 tasks, set alarms, and be in bed by 23:00. Six hours is the current target; increase it when your schedule allows.", pomoDurationMinutes: 30 },
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
  workout: false,
  mobility: false,
  sreWeekday: false,
  sreWeekend: false,
  nysc: false,
  reading: false,
  sleep: false,
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
