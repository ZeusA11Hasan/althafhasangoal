import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Plus } from "lucide-react";
import { useMission, type DailyMissionItem, istDateKey } from "@/lib/mission/store";
import { COLORS as PALETTE } from "@/lib/mission/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 6;   // 6 AM
const END_HOUR = 23;    // 11 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

function toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function toY(minutes: number): number {
    return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function fmtHour(hour: number): string {
    const period = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h} ${period}`;
}

function isToday(date: string): boolean {
    return date === istDateKey();
}

interface OverlapInfo {
    id: string;
    overlapsWith: string[];
}

function findOverlaps(items: DailyMissionItem[]): OverlapInfo[] {
    const timed = items.filter((i) => i.startTime && i.durationMinutes);
    const overlaps: OverlapInfo[] = [];

    for (let i = 0; i < timed.length; i++) {
        const a = timed[i];
        const aStart = toMinutes(a.startTime!);
        const aEnd = aStart + a.durationMinutes!;
        const overlapping: string[] = [];

        for (let j = 0; j < timed.length; j++) {
            if (i === j) continue;
            const b = timed[j];
            const bStart = toMinutes(b.startTime!);
            const bEnd = bStart + b.durationMinutes!;
            if (aStart < bEnd && aEnd > bStart) {
                overlapping.push(b.id);
            }
        }

        if (overlapping.length > 0) {
            overlaps.push({ id: a.id, overlapsWith: overlapping });
        }
    }

    return overlaps;
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface DayScheduleProps {
    date: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DaySchedule({ date }: DayScheduleProps) {
    const days = useMission((s) => s.days);
    const defaultMissions = useMission((s) => s.dailyMission);
    const updateDailyMission = useMission((s) => s.updateDailyMission);
    const addDailyMission = useMission((s) => s.addDailyMission);

    const day = days[date];
    const missions = day?.dailyMission ?? defaultMissions;
    const timedItems = missions.filter((m) => m.startTime && m.durationMinutes);
    const untimedItems = missions.filter((m) => !m.startTime);
    const overlaps = useMemo(() => findOverlaps(timedItems), [timedItems]);

    const nowMinutes = useMemo(() => {
        if (!isToday(date)) return -1;
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }, [date]);

    const nowY = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60 ? toY(nowMinutes) : -1;

    // ── Drag state (framer-motion drag) ──
    const constraintsRef = useRef<HTMLDivElement>(null);
    const [dragId, setDragId] = useState<string | null>(null);

    const handleDragEnd = (itemId: string, _: any, info: { offset: { y: number } }) => {
        const item = timedItems.find((m) => m.id === itemId);
        if (!item) return;

        const currentY = toY(toMinutes(item.startTime!));
        const newY = currentY + info.offset.y;
        // Snap to 15-min increments
        const snapped = Math.round(newY / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
        const clampedY = Math.max(0, Math.min(GRID_HEIGHT - 20, snapped));
        const totalMinutes = START_HOUR * 60 + (clampedY / HOUR_HEIGHT) * 60;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const newStart = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        updateDailyMission(date, itemId, { startTime: newStart });
        setDragId(null);
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                        Day Schedule
                    </div>
                    {timedItems.length === 0 && untimedItems.length > 0 && (
                        <span className="text-[10px] text-warning ml-2">
                            ({untimedItems.length} tasks without time)
                        </span>
                    )}
                </div>
                {overlaps.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-danger">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{overlaps.length} overlap{overlaps.length > 1 ? "s" : ""}</span>
                    </div>
                )}
            </div>

            {timedItems.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-12 italic">
                    No scheduled tasks. Set a start time on any daily mission to see it on the timeline.
                </div>
            ) : (
                /* ── Timeline Grid ── */
                <div
                    ref={constraintsRef}
                    className="relative"
                    style={{ height: GRID_HEIGHT }}
                >
                    {/* Hour rows */}
                    {Array.from({ length: TOTAL_HOURS }, (_, i) => {
                        const hour = START_HOUR + i;
                        return (
                            <div
                                key={hour}
                                className="absolute left-0 right-0 flex items-start border-t border-white/[0.04]"
                                style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                            >
                                <span className="text-[10px] tabular-nums text-muted-foreground/60 mt-[-6px] w-12 text-right pr-3 select-none">
                                    {fmtHour(hour)}
                                </span>
                            </div>
                        );
                    })}

                    {/* Task blocks */}
                    {timedItems.map((item) => {
                        const startMin = toMinutes(item.startTime!);
                        const top = toY(startMin);
                        const duration = item.durationMinutes ?? 30;
                        const height = Math.max(20, (duration / 60) * HOUR_HEIGHT);
                        const color = item.color ?? "#60a5fa";
                        const hasOverlap = overlaps.some(
                            (o) => o.id === item.id || o.overlapsWith.includes(item.id),
                        );
                        const isDragging = dragId === item.id;

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                drag="y"
                                dragConstraints={constraintsRef}
                                dragElastic={0}
                                dragMomentum={false}
                                onDragStart={() => setDragId(item.id)}
                                onDragEnd={(_, info) => handleDragEnd(item.id, _, info)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98, cursor: "grabbing" }}
                                className={`absolute left-14 right-2 z-10 rounded-xl cursor-grab overflow-hidden transition-shadow ${isDragging
                                        ? "shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-80 z-30"
                                        : "hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                                    } ${hasOverlap ? "ring-1 ring-danger/50" : ""}`}
                                style={{
                                    top,
                                    height,
                                    background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                                    border: `1px solid ${color}50`,
                                }}
                            >
                                <div
                                    className="absolute inset-y-0 left-0 w-[3px] rounded-full"
                                    style={{ background: color }}
                                />
                                <div className="pl-3 pr-2 py-1 flex items-center justify-between gap-2 h-full">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs text-foreground truncate font-medium">
                                            {item.label}
                                        </div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                                            {item.startTime}
                                            {item.durationMinutes ? ` · ${item.durationMinutes}m` : ""}
                                        </div>
                                    </div>
                                    {hasOverlap && (
                                        <AlertTriangle className="h-3 w-3 text-danger shrink-0" />
                                    )}
                                    {item.target && (
                                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground shrink-0">
                                            {item.target} {item.unit}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* "Now" indicator */}
                    {nowY >= 0 && (
                        <div
                            className="absolute left-0 right-0 z-20 pointer-events-none"
                            style={{ top: nowY }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <span className="text-[9px] uppercase tracking-widest text-danger font-semibold">
                                    Now
                                </span>
                                <div className="flex-1 h-px bg-danger/60" />
                            </div>
                        </div>
                    )}

                    {/* Double-click empty slot to add task */}
                    <div
                        className="absolute left-14 right-2 top-0 bottom-0 z-0"
                        onDoubleClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const snapped = Math.round(y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
                            const totalMinutes = START_HOUR * 60 + (snapped / HOUR_HEIGHT) * 60;
                            const h = Math.floor(totalMinutes / 60);
                            const m = totalMinutes % 60;
                            const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                            addDailyMission(date, {
                                label: "New Block",
                                target: 1,
                                unit: "hr",
                                description: "",
                                priority: "medium",
                                color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                                kanban: "today",
                                startTime: time,
                                durationMinutes: 60,
                            });
                        }}
                    />
                </div>
            )}

            {/* Overlap detail */}
            {overlaps.length > 0 && (
                <div className="rounded-xl bg-danger/5 border border-danger/10 p-3">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-danger mb-2">
                        ⚠ Schedule Conflicts
                    </div>
                    <div className="space-y-1.5">
                        {overlaps.map((o) => {
                            const item = missions.find((m) => m.id === o.id);
                            const others = o.overlapsWith
                                .map((id) => missions.find((m) => m.id === id)?.label)
                                .filter(Boolean);
                            return (
                                <div key={o.id} className="text-xs text-muted-foreground">
                                    <span className="text-foreground">{item?.label}</span>
                                    {" overlaps with "}
                                    <span className="text-foreground">{others.join(", ")}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}