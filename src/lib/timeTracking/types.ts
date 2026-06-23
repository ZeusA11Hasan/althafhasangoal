/**
 * Core types for the Time Tracking Engine.
 * All dashboards, streaks, KPIs, and charts derive from stored session records.
 */

export type SessionType = "focus" | "break" | "sleep" | "workout" | "deepwork";

export interface TimeSession {
  id: string;
  taskId?: string;
  taskName: string;
  category: string;
  type: SessionType;
  startTime: number; // epoch ms
  endTime: number | null; // epoch ms; null while active
  durationSeconds: number; // finalized or accumulated while active
  date: string; // yyyy-MM-dd IST
  completed: boolean;
  /** milliseconds of paused time already accounted for */
  totalPausedMs: number;
  /** timestamp when last paused; null when running */
  pausedAt: number | null;
}

export interface SessionCreateInput {
  taskId?: string;
  taskName: string;
  category?: string;
  type: SessionType;
  date?: string;
}

export interface DailyAggregate {
  date: string;
  totalSeconds: number;
  focusSeconds: number;
  breakSeconds: number;
  sleepSeconds: number;
  workoutSeconds: number;
  deepWorkSeconds: number;
  taskCount: number;
  completedCount: number;
  taskNames: string[];
  revenue: number; // pulled from Zustand day entry if available
  coldCalls: number;
  followUps: number;
  dealsClosed: number;
  hoursWorked: number; // totalSeconds / 3600
}

export interface WeeklyAggregate {
  weekKey: string; // yyyy-MM-dd (Monday)
  totalSeconds: number;
  focusSeconds: number;
  breakSeconds: number;
  sleepSeconds: number;
  workoutSeconds: number;
  deepWorkSeconds: number;
  taskCount: number;
  completedCount: number;
  daysActive: number;
  hoursWorked: number;
}

export interface MonthlyAggregate {
  monthKey: string; // yyyy-MM
  totalSeconds: number;
  focusSeconds: number;
  breakSeconds: number;
  sleepSeconds: number;
  workoutSeconds: number;
  deepWorkSeconds: number;
  taskCount: number;
  completedCount: number;
  daysActive: number;
  hoursWorked: number;
}

export interface AnalyticsSnapshot {
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  totalHours: number;
  totalTasks: number;
  completionRate: number;
  deepWorkHours: number;
  breakHours: number;
  sleepHours: number;
  focusScore: number;
  streak: { current: number; best: number };
  workoutStreak: number;
  dailyAggregates: DailyAggregate[];
  weeklyAggregates: WeeklyAggregate[];
  monthlyAggregates: MonthlyAggregate[];
  taskSeries: TaskSeriesPoint[];
}

export interface TaskSeriesPoint {
  date: string;
  label: string;
  [taskName: string]: string | number;
}

export interface FocusBreakRatio {
  focusSeconds: number;
  breakSeconds: number;
  ratio: number; // focus / break
}

export interface SleepProductivityCorrelation {
  date: string;
  sleepHours: number;
  productiveHours: number;
}
