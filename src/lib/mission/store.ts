import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedHours: number;
  actualHours: number;
  status: TaskStatus;
  // timer
  timerRunning: boolean;
  timerStartedAt: number | null; // epoch ms
  accumulatedMs: number;
}

export interface DayEntry {
  date: string; // yyyy-mm-dd
  hoursWorked: number;
  tasksCompleted: number;
  tasksCancelled: number;
  revenueGenerated: number;
  coldCalls: number;
  followUps: number;
  dealsClosed: number;
  notes: string;
  tasks: Task[];
}

export interface MissionState {
  // Mission target
  missionTarget: string; // ISO date
  missionStart: string;

  // Financial
  revenueTarget: number;
  currentRevenue: number;
  clientTarget: number;
  currentClients: number;

  // Activity rollups
  coldCalls: number;
  followUps: number;
  dealsClosed: number;

  // Daily log
  days: Record<string, DayEntry>;

  // setters
  setField: <K extends keyof MissionState>(k: K, v: MissionState[K]) => void;
  patch: (p: Partial<MissionState>) => void;

  upsertDay: (date: string, patch: Partial<DayEntry>) => void;
  addTask: (date: string, task: Omit<Task, "id" | "actualHours" | "timerRunning" | "timerStartedAt" | "accumulatedMs">) => void;
  updateTask: (date: string, taskId: string, patch: Partial<Task>) => void;
  deleteTask: (date: string, taskId: string) => void;
  startTimer: (date: string, taskId: string) => void;
  pauseTimer: (date: string, taskId: string) => void;
  stopTimer: (date: string, taskId: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function seedDays(): Record<string, DayEntry> {
  const out: Record<string, DayEntry> = {};
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const intensity = Math.random();
    out[key] = {
      date: key,
      hoursWorked: Math.round(intensity * 9 * 10) / 10,
      tasksCompleted: Math.floor(intensity * 8),
      tasksCancelled: Math.floor(Math.random() * 2),
      revenueGenerated: Math.floor(intensity * 8000),
      coldCalls: Math.floor(intensity * 25),
      followUps: Math.floor(intensity * 10),
      dealsClosed: Math.random() > 0.7 ? 1 : 0,
      notes: "",
      tasks: [],
    };
  }
  return out;
}

export const useMission = create<MissionState>()(
  persist(
    (set, get) => ({
      missionTarget: "2029-06-10T00:00:00.000Z",
      missionStart: new Date().toISOString(),

      revenueTarget: 100000,
      currentRevenue: 10000,
      clientTarget: 10,
      currentClients: 1,

      coldCalls: 42,
      followUps: 18,
      dealsClosed: 1,

      days: seedDays(),

      setField: (k, v) => set({ [k]: v } as any),
      patch: (p) => set(p),

      upsertDay: (date, p) =>
        set((s) => {
          const prev = s.days[date] ?? {
            date,
            hoursWorked: 0,
            tasksCompleted: 0,
            tasksCancelled: 0,
            revenueGenerated: 0,
            coldCalls: 0,
            followUps: 0,
            dealsClosed: 0,
            notes: "",
            tasks: [],
          };
          return { days: { ...s.days, [date]: { ...prev, ...p } } };
        }),

      addTask: (date, task) => {
        const id = crypto.randomUUID();
        const newTask: Task = {
          ...task,
          id,
          actualHours: 0,
          timerRunning: false,
          timerStartedAt: null,
          accumulatedMs: 0,
        };
        get().upsertDay(date, { tasks: [...(get().days[date]?.tasks ?? []), newTask] });
      },
      updateTask: (date, taskId, patch) => {
        const day = get().days[date];
        if (!day) return;
        const tasks = day.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
        get().upsertDay(date, { tasks });
      },
      deleteTask: (date, taskId) => {
        const day = get().days[date];
        if (!day) return;
        get().upsertDay(date, { tasks: day.tasks.filter((t) => t.id !== taskId) });
      },
      startTimer: (date, taskId) => {
        get().updateTask(date, taskId, {
          timerRunning: true,
          timerStartedAt: Date.now(),
          status: "in_progress",
        });
      },
      pauseTimer: (date, taskId) => {
        const day = get().days[date];
        const t = day?.tasks.find((x) => x.id === taskId);
        if (!t || !t.timerRunning || !t.timerStartedAt) return;
        const elapsed = Date.now() - t.timerStartedAt;
        get().updateTask(date, taskId, {
          timerRunning: false,
          timerStartedAt: null,
          accumulatedMs: t.accumulatedMs + elapsed,
          actualHours: +(((t.accumulatedMs + elapsed) / 3600000)).toFixed(2),
        });
      },
      stopTimer: (date, taskId) => {
        const day = get().days[date];
        const t = day?.tasks.find((x) => x.id === taskId);
        if (!t) return;
        const elapsed = t.timerRunning && t.timerStartedAt ? Date.now() - t.timerStartedAt : 0;
        const totalMs = t.accumulatedMs + elapsed;
        get().updateTask(date, taskId, {
          timerRunning: false,
          timerStartedAt: null,
          accumulatedMs: totalMs,
          actualHours: +(totalMs / 3600000).toFixed(2),
        });
      },
    }),
    { name: "mission-2029" },
  ),
);

export const todayKey = today;