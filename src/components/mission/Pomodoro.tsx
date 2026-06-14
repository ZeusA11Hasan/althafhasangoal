import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { useMission } from "@/lib/mission/store";

const PRESETS = [25, 45, 60, 90];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function Pomodoro() {
  const { dailyMission, logPomodoroSession } = useMission();
  const todayTasks = useMemo(
    () => dailyMission.filter((d) => d.kanban !== "done" && !d.done),
    [dailyMission],
  );

  const [label, setLabel] = useState<string>(() => todayTasks[0]?.label ?? "Deep Work");
  const [targetMin, setTargetMin] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef<number>(25 * 60);

  // Reset on preset change
  useEffect(() => {
    if (!running) {
      setRemaining(targetMin * 60);
      baseRef.current = targetMin * 60;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMin]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      if (startRef.current == null) return;
      const elapsed = (Date.now() - startRef.current) / 1000;
      const next = Math.max(0, baseRef.current - elapsed);
      setRemaining(next);
      if (next <= 0) {
        clearInterval(t);
        finish(true);
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    startRef.current = Date.now();
    setRunning(true);
  }
  function pause() {
    if (startRef.current == null) return;
    const elapsed = (Date.now() - startRef.current) / 1000;
    baseRef.current = Math.max(0, baseRef.current - elapsed);
    setRemaining(baseRef.current);
    setRunning(false);
    startRef.current = null;
  }
  function reset() {
    setRunning(false);
    startRef.current = null;
    baseRef.current = targetMin * 60;
    setRemaining(targetMin * 60);
  }
  function finish(auto = false) {
    let workedSec: number;
    if (auto) workedSec = targetMin * 60;
    else {
      if (running && startRef.current != null) {
        const elapsed = (Date.now() - startRef.current) / 1000;
        workedSec = Math.max(0, targetMin * 60 - Math.max(0, baseRef.current - elapsed));
      } else {
        workedSec = Math.max(0, targetMin * 60 - baseRef.current);
      }
    }
    setRunning(false);
    startRef.current = null;
    const minutes = +(workedSec / 60).toFixed(2);
    if (minutes > 0.1) logPomodoroSession(label || "Focus", minutes);
    baseRef.current = targetMin * 60;
    setRemaining(targetMin * 60);
  }

  const progress = 1 - remaining / (targetMin * 60);
  const circ = 2 * Math.PI * 120;

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

        <div className="neu p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Timer ring */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="280" height="280" viewBox="0 0 280 280">
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - progress)}
                  transform="rotate(-90 140 140)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-display text-6xl tabular-nums text-foreground">
                  {fmt(remaining)}
                </div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mt-2">
                  {running ? "Focusing" : "Ready"}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
                Working on
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {todayTasks.slice(0, 8).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLabel(t.label)}
                    className={`text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border transition ${
                      label === t.label
                        ? "bg-white text-black border-white"
                        : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Or type a custom task…"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-white/30 text-foreground"
              />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
                Target (minutes)
              </div>
              <div className="flex gap-2 mb-3">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTargetMin(p)}
                    disabled={running}
                    className={`flex-1 py-2 rounded-xl border text-sm tabular-nums transition ${
                      targetMin === p
                        ? "bg-white text-black border-white"
                        : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30"
                    } ${running ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {p}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  value={targetMin}
                  onChange={(e) => setTargetMin(Math.max(1, +e.target.value || 1))}
                  disabled={running}
                  className="w-20 rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30 text-foreground tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {!running ? (
                <button
                  onClick={start}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-black py-3 text-xs uppercase tracking-[0.3em] font-medium"
                >
                  <Play className="h-4 w-4" /> Start
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/10 text-foreground py-3 text-xs uppercase tracking-[0.3em] font-medium border border-white/20"
                >
                  <Pause className="h-4 w-4" /> Pause
                </button>
              )}
              <button
                onClick={() => finish(false)}
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-foreground/80 hover:text-foreground py-3 px-5 text-xs uppercase tracking-[0.3em]"
                title="Log elapsed time to today's tasks"
              >
                <Check className="h-4 w-4" /> Log
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground py-3 px-4"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Finished sessions feed today's hours, hours-per-task chart, and the Founder Operating System.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}