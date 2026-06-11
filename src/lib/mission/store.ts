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
  // v2 metrics
  workoutDone?: boolean;
  learningHours?: number;
  readingMinutes?: number;
  sleepHours?: number;
  deepWorkHours?: number;
  outreachSent?: number;
}

export interface Milestone {
  id: string;
  label: string;
  targetRevenue: number;
  targetDate: string; // ISO
  done: boolean;
}

export interface Skill {
  id: string;
  name: string;
  xp: number;
  xpPerLevel: number;
}

export interface VisionItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
}

export interface DailyMissionItem {
  id: string;
  label: string;
  target: number;
  unit: string; // e.g. "msgs", "hrs"
  done: boolean;
}

export interface MissionState {
  // Mission target
  missionTarget: string; // ISO date
  missionStart: string;

  // Financial
  revenueTarget: number;
  currentRevenue: number;
  monthlyRevenue: number;
  monthlyTarget: number;
  clientTarget: number;
  currentClients: number;

  // Activity rollups
  coldCalls: number;
  followUps: number;
  dealsClosed: number;

  // Daily log
  days: Record<string, DayEntry>;

  // v2
  milestones: Milestone[];
  skills: Skill[];
  visions: VisionItem[];
  dailyMission: DailyMissionItem[];
  visitedCountries: string[]; // ISO codes or names
  travelBucket: string[];

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

  upsertMilestone: (m: Milestone) => void;
  removeMilestone: (id: string) => void;
  addSkillXP: (id: string, xp: number) => void;
  toggleCountry: (code: string) => void;
  toggleDailyMission: (id: string) => void;
  addVision: (v: Omit<VisionItem, "id">) => void;
  removeVision: (id: string) => void;
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
      monthlyRevenue: 10000,
      monthlyTarget: 10000000,
      clientTarget: 10,
      currentClients: 1,

      coldCalls: 42,
      followUps: 18,
      dealsClosed: 1,

      days: seedDays(),

      milestones: [
        { id: "m1", label: "₹1L / month", targetRevenue: 100000, targetDate: "2026-12-31", done: false },
        { id: "m2", label: "₹10L / month", targetRevenue: 1000000, targetDate: "2028-02-01", done: false },
        { id: "m3", label: "₹1 Cr / month", targetRevenue: 10000000, targetDate: "2029-06-10", done: false },
      ],
      skills: [
        { id: "sales", name: "Sales", xp: 450, xpPerLevel: 1000 },
        { id: "ai", name: "AI Automation", xp: 720, xpPerLevel: 1000 },
        { id: "react", name: "React", xp: 1850, xpPerLevel: 1000 },
        { id: "js", name: "JavaScript", xp: 2400, xpPerLevel: 1000 },
        { id: "biz", name: "Business", xp: 300, xpPerLevel: 1000 },
        { id: "marketing", name: "Marketing", xp: 220, xpPerLevel: 1000 },
        { id: "leadership", name: "Leadership", xp: 150, xpPerLevel: 1000 },
      ],
      visions: [
        { id: "v1", title: "₹1L / month", subtitle: "First proof of model", tag: "Revenue" },
        { id: "v2", title: "₹10L / month", subtitle: "Scale the engine", tag: "Revenue" },
        { id: "v3", title: "₹1Cr / month", subtitle: "Category leader", tag: "Revenue" },
        { id: "v4", title: "World Tour", subtitle: "195 countries", tag: "Lifestyle" },
        { id: "v5", title: "Dream Physique", subtitle: "Sub-12% body fat", tag: "Body" },
        { id: "v6", title: "AI Empire", subtitle: "Autonomous products", tag: "Build" },
        { id: "v7", title: "Financial Freedom", subtitle: "Sovereign capital", tag: "Freedom" },
      ],
      dailyMission: [
        { id: "d1", label: "Outreach Messages", target: 20, unit: "msgs", done: false },
        { id: "d2", label: "Follow Ups", target: 5, unit: "msgs", done: false },
        { id: "d3", label: "Sales Calls", target: 1, unit: "call", done: false },
        { id: "d4", label: "Workout", target: 1, unit: "session", done: false },
        { id: "d5", label: "Deep Learning", target: 2, unit: "hrs", done: false },
        { id: "d6", label: "Build Product", target: 3, unit: "hrs", done: false },
      ],
      visitedCountries: ["IN"],
      travelBucket: ["JP", "US", "AE", "CH", "IS"],

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

      upsertMilestone: (m) =>
        set((s) => {
          const idx = s.milestones.findIndex((x) => x.id === m.id);
          const next = [...s.milestones];
          if (idx >= 0) next[idx] = m;
          else next.push(m);
          return { milestones: next };
        }),
      removeMilestone: (id) =>
        set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) })),
      addSkillXP: (id, xp) =>
        set((s) => ({
          skills: s.skills.map((sk) => (sk.id === id ? { ...sk, xp: sk.xp + xp } : sk)),
        })),
      toggleCountry: (code) =>
        set((s) => ({
          visitedCountries: s.visitedCountries.includes(code)
            ? s.visitedCountries.filter((c) => c !== code)
            : [...s.visitedCountries, code],
        })),
      toggleDailyMission: (id) =>
        set((s) => ({
          dailyMission: s.dailyMission.map((d) =>
            d.id === id ? { ...d, done: !d.done } : d,
          ),
        })),
      addVision: (v) =>
        set((s) => ({
          visions: [...s.visions, { ...v, id: crypto.randomUUID() }],
        })),
      removeVision: (id) =>
        set((s) => ({ visions: s.visions.filter((v) => v.id !== id) })),
    }),
    { name: "mission-2029" },
  ),
);

export const todayKey = today;