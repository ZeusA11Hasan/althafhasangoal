import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { useMission } from "@/lib/mission/store";
import { useTimeSession, useSessionRecovery } from "@/lib/timeTracking/hooks";
import { TimeTrackingService } from "@/lib/timeTracking/TimeTrackingService";
import { AnalyticsService } from "@/lib/timeTracking/AnalyticsService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRESETS = [25, 45, 60, 90];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export interface PomodoroProps {
  date?: string; // IST yyyy-MM-dd; if omitted, logs to selectedDate
  compact?: boolean;
}

export function Pomodoro({ date, compact = false }: PomodoroProps) {
  useSessionRecovery();

  const selectedDate = useMission((s) => s.selectedDate);
  const days = useMission((s) => s.days);
  const dailyMission = useMission((s) => s.dailyMission);
  const logPomodoroSession = useMission((s) => s.logPomodoroSession);
  const activeDate = date ?? selectedDate;
  const activeDay = days[activeDate];
  const activeMissions = activeDay?.dailyMission ?? dailyMission;
  const activeTasks = activeDay?.tasks ?? [];

  const suggestions = useMemo(() => {
    const list = new Set<string>();
    activeMissions.forEach((m) => list.add(m.label));
    activeTasks.forEach((t) => list.add(t.title));
    return Array.from(list);
  }, [activeMissions, activeTasks]);

  const [label, setLabel] = useState<string>(() => suggestions[0] ?? "Deep Work");
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [targetMin, setTargetMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);

  const {
    session,
    elapsedSeconds,
    isRunning,
    isPaused,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    stop: stopSession,
  } = useTimeSession();

  const currentLimit = mode === "focus" ? targetMin * 60 : breakMin * 60;
  const remaining = Math.max(0, currentLimit - elapsedSeconds);
  const progress = 1 - remaining / currentLimit;

  // Sync label when suggestions change
  useEffect(() => {
    if (suggestions.length > 0 && !suggestions.includes(label)) {
      setLabel(suggestions[0]);
    }
  }, [suggestions, label]);

  // When mode changes and not running, reset the timer display
  useEffect(() => {
    if (!session) {
      const limit = mode === "focus" ? targetMin * 60 : breakMin * 60;
      // No local state needed; remaining is derived from elapsedSeconds
    }
  }, [mode, targetMin, breakMin, session]);

  const handleStart = useCallback(async () => {
    if (mode === "focus") {
      await startSession(label, "focus", activeDate);
    } else {
      await startSession("Break", "break", activeDate);
    }
  }, [mode, label, activeDate, startSession]);

  const handlePause = useCallback(async () => {
    await pauseSession();
  }, [pauseSession]);

  const handleResume = useCallback(async () => {
    await resumeSession();
  }, [resumeSession]);

  const handleFinish = useCallback(
    async (auto = false) => {
      const finalized = await stopSession();
      if (finalized && finalized.type === "focus" && finalized.durationSeconds > 6) {
        const minutes = +(finalized.durationSeconds / 60).toFixed(2);
        logPomodoroSession(finalized.taskName, minutes, activeDate);
      }
      AnalyticsService.invalidateCache();

      if (auto) {
        if (mode === "focus") {
          setMode("break");
          await startSession("Break", "break", activeDate);
        } else {
          setMode("focus");
        }
      }
    },
    [stopSession, logPomodoroSession, activeDate, mode, startSession],
  );

  const handleReset = useCallback(async () => {
    if (session) {
      await TimeTrackingService.discardSession();
    }
  }, [session]);

  // Auto-finish when countdown reaches zero
  useEffect(() => {
    if (session && remaining <= 0 && isRunning) {
      handleFinish(true);
    }
  }, [remaining, isRunning, session, handleFinish]);

  const ringSize = compact ? 180 : 280;
  const ringR = compact ? 78 : 120;
  const ringCirc = 2 * Math.PI * ringR;

  const Panel = (
    <div
      className={
        compact
          ? "rounded-2xl border border-white/10 bg-black/30 p-5 space-y-5"
          : "neu p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
      }
    >
      {/* Timer ring */}
      <div className="flex flex-col items-center justify-center">
        {/* Focus / Break Switcher */}
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => {
              if (session) return;
              setMode("focus");
            }}
            disabled={!!session}
            className={`px-4 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full transition ${
              mode === "focus"
                ? "bg-white text-black font-semibold"
                : "text-muted-foreground hover:text-foreground"
            } ${session ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Focus
          </button>
          <button
            onClick={() => {
              if (session) return;
              setMode("break");
            }}
            disabled={!!session}
            className={`px-4 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full transition ${
              mode === "break"
                ? "bg-white text-black font-semibold"
                : "text-muted-foreground hover:text-foreground"
            } ${session ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Break
          </button>
        </div>

        <div className="relative">
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringR}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
            <motion.circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringR}
              fill="none"
              stroke={mode === "focus" ? "white" : "#34d399"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringCirc * (1 - progress)}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`text-display tabular-nums text-foreground ${compact ? "text-4xl" : "text-6xl"}`}
            >
              {fmt(remaining)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mt-2">
              {isRunning
                ? mode === "focus"
                  ? "Focusing"
                  : "On Break"
                : isPaused
                  ? "Paused"
                  : "Ready"}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-5">
        {mode === "focus" && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
              Working on
            </div>
            <Select value={label} onValueChange={setLabel} disabled={!!session}>
              <SelectTrigger
                className={`w-full rounded-full bg-black/60 border border-white/15 px-5 py-3 text-foreground text-sm outline-none focus:border-white/30 focus:ring-0 transition-colors hover:border-white/25 ${session ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <SelectValue placeholder="Select a task…" />
              </SelectTrigger>
              <SelectContent
                className="bg-[#0c0c0e] border border-white/10 text-foreground rounded-2xl max-h-72 p-1.5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)]"
                position="popper"
                sideOffset={6}
              >
                {suggestions.length === 0 && (
                  <div className="px-3 py-2.5 text-xs text-muted-foreground">
                    No tasks for this day
                  </div>
                )}
                {suggestions.map((sug) => (
                  <SelectItem
                    key={sug}
                    value={sug}
                    className="text-sm text-white/90 rounded-xl cursor-pointer px-3 py-2.5 transition-colors [&[data-highlighted]]:!bg-[#2563eb] [&[data-highlighted]]:!text-white [&[data-state=checked]]:!bg-[#2563eb] [&[data-state=checked]]:!text-white"
                  >
                    {sug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
              Focus (Min)
            </div>
            <input
              type="number"
              min={1}
              value={targetMin}
              onChange={(e) => setTargetMin(Math.max(1, +e.target.value || 1))}
              disabled={!!session}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30 text-foreground tabular-nums text-sm"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
              Break (Min)
            </div>
            <input
              type="number"
              min={1}
              value={breakMin}
              onChange={(e) => setBreakMin(Math.max(1, +e.target.value || 1))}
              disabled={!!session}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30 text-foreground tabular-nums text-sm"
            />
          </div>
        </div>

        {mode === "focus" && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
              Focus Presets
            </div>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setTargetMin(p)}
                  disabled={!!session}
                  className={`flex-1 py-1.5 rounded-xl border text-xs tabular-nums transition ${
                    targetMin === p
                      ? "bg-white text-black border-white"
                      : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30"
                  } ${session ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!isRunning && !isPaused ? (
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-black py-2.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-white/95 active:scale-95 transition"
            >
              <Play className="h-4 w-4" /> Start
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-black py-2.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-white/95 active:scale-95 transition"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/10 text-foreground py-2.5 text-[11px] uppercase tracking-[0.3em] font-medium border border-white/20 hover:bg-white/[0.15] active:scale-95 transition"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          )}
          {mode === "focus" && (
            <button
              onClick={() => handleFinish(false)}
              className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-foreground/80 hover:text-foreground py-2.5 px-4 text-[11px] uppercase tracking-[0.3em] hover:bg-white/5 active:scale-95 transition"
              title="Log elapsed time"
            >
              <Check className="h-4 w-4" /> Log
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center justify-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground py-2.5 px-3 hover:bg-white/5 active:scale-95 transition"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center">
          LOGGED TO THIS DATE'S HOURS & TASKS.
        </div>
      </div>
    </div>
  );

  if (compact) return Panel;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              03 · Focus Session
            </div>
            <h2 className="text-display text-4xl md:text-6xl text-foreground">
              Pomodoro. <span className="text-muted-foreground">One task at a time.</span>
            </h2>
          </div>
        </div>

        {Panel}
      </div>
    </section>
  );
}
