import type { DailyMissionItem } from "@/lib/mission/store";

export type Priority = NonNullable<DailyMissionItem["priority"]>;

export const PRIORITIES: { id: Priority; label: string }[] = [
    { id: "low", label: "Low" },
    { id: "medium", label: "Medium" },
    { id: "high", label: "High" },
    { id: "critical", label: "Critical" },
];

/** Simple string array of priority IDs for iteration */
export const PRIORITY_IDS = PRIORITIES.map((p) => p.id);

export const COLORS = [
    "#60a5fa",
    "#a78bfa",
    "#f43f5e",
    "#34d399",
    "#fbbf24",
    "#22d3ee",
    "#f97316",
    "#e5e7eb",
];

export const PALETTE = COLORS;

export function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}