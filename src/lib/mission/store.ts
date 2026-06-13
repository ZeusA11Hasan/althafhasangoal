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
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  color?: string; // hex
  kanban?: "backlog" | "today" | "doing" | "done";
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
  addDailyMission: (m: Omit<DailyMissionItem, "id" | "done">) => void;
  updateDailyMission: (id: string, patch: Partial<DailyMissionItem>) => void;
  deleteDailyMission: (id: string) => void;
  setKanban: (id: string, status: NonNullable<DailyMissionItem["kanban"]>) => void;
  addVision: (v: Omit<VisionItem, "id">) => void;
  removeVision: (id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useMission = create<MissionState>()(
  persist(
    (set, get) => ({
      missionTarget: "2029-06-10T00:00:00.000Z",
      missionStart: new Date().toISOString(),

      revenueTarget: 10000000,
      currentRevenue: 0,
      monthlyRevenue: 0,
      monthlyTarget: 10000000,
      clientTarget: 10,
      currentClients: 0,

      coldCalls: 0,
      followUps: 0,
      dealsClosed: 0,

      days: {},

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
        { id: "d1", label: "Outreach Messages", target: 20, unit: "msgs", done: false, priority: "high", color: "#60a5fa", kanban: "today", description: "DM 20 qualified leads." },
        { id: "d2", label: "Follow Ups", target: 5, unit: "msgs", done: false, priority: "medium", color: "#a78bfa", kanban: "today", description: "Chase warm prospects." },
        { id: "d3", label: "Sales Calls", target: 1, unit: "call", done: false, priority: "critical", color: "#f43f5e", kanban: "doing", description: "Close one discovery call." },
        { id: "d4", label: "Workout", target: 1, unit: "session", done: false, priority: "medium", color: "#34d399", kanban: "today", description: "60 min strength." },
        { id: "d5", label: "Deep Learning", target: 2, unit: "hrs", done: false, priority: "low", color: "#fbbf24", kanban: "backlog", description: "Read & take notes." },
        { id: "d6", label: "Build Product", target: 3, unit: "hrs", done: false, priority: "high", color: "#22d3ee", kanban: "doing", description: "Ship one feature." },
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
      addDailyMission: (m) =>
        set((s) => ({
          dailyMission: [
            ...s.dailyMission,
            {
              id: crypto.randomUUID(),
              done: false,
              kanban: m.kanban ?? "backlog",
              priority: m.priority ?? "medium",
              color: m.color ?? "#60a5fa",
              ...m,
            },
          ],
        })),
      updateDailyMission: (id, patch) =>
        set((s) => ({
          dailyMission: s.dailyMission.map((d) =>
            d.id === id ? { ...d, ...patch } : d,
          ),
        })),
      deleteDailyMission: (id) =>
        set((s) => ({
          dailyMission: s.dailyMission.filter((d) => d.id !== id),
        })),
      setKanban: (id, status) =>
        set((s) => ({
          dailyMission: s.dailyMission.map((d) =>
            d.id === id ? { ...d, kanban: status } : d,
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