import { useMemo } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useMission, type DayEntry } from "@/lib/mission/store";

export interface StreakInfo {
    current: number;
    best: number;
}

export interface WeeklySummary {
    totalHours: number;
    avgHoursPerDay: number;
    totalRevenue: number;
    totalTasks: number;
    totalCalls: number;
    daysActive: number;
}

export interface AnalyticsSnapshot {
    streak: StreakInfo;
    workoutStreak: number;
    weeklySummary: WeeklySummary;
    monthlySummary: WeeklySummary;
    avgSleep: number;
    deepWorkTotal: number;
    completionRate: number;
}

function calcStreak(days: Record<string, DayEntry>): StreakInfo {
    const sorted = Object.values(days)
        .filter((d) => d.hoursWorked > 0)
        .map((d) => d.date)
        .sort();
    if (!sorted.length) return { current: 0, best: 0 };

    let best = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
        if (differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1])) === 1) {
            run++;
            best = Math.max(best, run);
        } else {
            run = 1;
        }
    }

    let current = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        if (days[k] && days[k].hoursWorked > 0) current++;
        else break;
    }
    return { current, best };
}

function calcWorkoutStreak(days: Record<string, DayEntry>): number {
    let n = 0;
    for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        if (days[k]?.workoutDone) n++;
        else break;
    }
    return n;
}

function calcSummary(
    days: Record<string, DayEntry>,
    daysBack: number,
): WeeklySummary {
    const now = new Date();
    const entries: DayEntry[] = [];
    for (let i = 0; i < daysBack; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        if (days[k]) entries.push(days[k]);
    }

    let totalHours = 0;
    let totalRevenue = 0;
    let totalTasks = 0;
    let totalCalls = 0;
    let daysActive = 0;

    for (const e of entries) {
        totalHours += e.hoursWorked ?? 0;
        totalRevenue += e.revenueGenerated ?? 0;
        totalTasks += e.tasksCompleted ?? 0;
        totalCalls += (e.coldCalls ?? 0) + (e.followUps ?? 0);
        if (e.hoursWorked > 0) daysActive++;
    }

    return {
        totalHours: +totalHours.toFixed(1),
        avgHoursPerDay: entries.length > 0 ? +(totalHours / entries.length).toFixed(1) : 0,
        totalRevenue,
        totalTasks,
        totalCalls,
        daysActive,
    };
}

function calcAvgSleep(days: Record<string, DayEntry>, daysBack: number): number {
    const now = new Date();
    let total = 0;
    let count = 0;
    for (let i = 0; i < daysBack; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        if (days[k]?.sleepHours) {
            total += days[k].sleepHours!;
            count++;
        }
    }
    return count > 0 ? +(total / count).toFixed(1) : 7.2;
}

function calcDeepWorkTotal(days: Record<string, DayEntry>): number {
    let total = 0;
    for (const d of Object.values(days)) {
        total += Math.max(0, (d.hoursWorked ?? 0) - 2);
    }
    return +total.toFixed(1);
}

function calcCompletionRate(days: Record<string, DayEntry>): number {
    let totalTasks = 0;
    let completed = 0;
    for (const d of Object.values(days)) {
        totalTasks += (d.tasksCompleted ?? 0) + (d.tasksCancelled ?? 0);
        completed += d.tasksCompleted ?? 0;
    }
    return totalTasks > 0 ? +((completed / totalTasks) * 100).toFixed(1) : 0;
}

/**
 * Centralized analytics hook that computes all derived metrics.
 * Uses a single useMemo with all dependencies to minimize recomputation.
 */
export function useAnalytics(): AnalyticsSnapshot {
    const days = useMission((s) => s.days);

    return useMemo(
        () => ({
            streak: calcStreak(days),
            workoutStreak: calcWorkoutStreak(days),
            weeklySummary: calcSummary(days, 7),
            monthlySummary: calcSummary(days, 30),
            avgSleep: calcAvgSleep(days, 7),
            deepWorkTotal: calcDeepWorkTotal(days),
            completionRate: calcCompletionRate(days),
        }),
        [days],
    );
}