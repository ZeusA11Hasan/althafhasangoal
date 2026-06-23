import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X } from "lucide-react";
import { useMission, istTomorrowMidnightISO, istDateKey } from "@/lib/mission/store";

const IST_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// Parse a yyyy-mm-dd string into a Date at IST midnight, return ISO
const parseYMD = (ymd: string): string | null => {
  const m = ymd.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  const dt = new Date(`${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00+05:30`);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

const fmtYMD = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return istDateKey(d);
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-display tabular-nums text-foreground text-xl md:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function Countdown() {
  const missionTarget = useMission((s) => s.missionTarget);
  const missionStart = useMission((s) => s.missionStart);
  const patch = useMission((s) => s.patch);
  const [editing, setEditing] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-correct: if mission start is in the past, push to next IST midnight.
  useEffect(() => {
    if (new Date(missionStart).getTime() <= Date.now()) {
      patch({ missionStart: istTomorrowMidnightISO() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const target = new Date(missionTarget).getTime();
  const start = new Date(missionStart).getTime();
  const hasStarted = now >= start;
  const totalRange = Math.max(1, target - start);
  const consumed = Math.max(0, Math.min(1, (now - start) / totalRange));

  // Countdown only starts ticking once mission start is reached.
  const ms = Math.max(0, target - Math.max(now, start));
  const msToStart = Math.max(0, start - now);
  const DAY = 24 * 3600 * 1000;
  const totalDays = Math.floor(ms / DAY);
  const totalHours = Math.floor(ms / (3600 * 1000));
  const totalMinutes = Math.floor(ms / 60000);
  const totalSeconds = Math.floor(ms / 1000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = Math.floor(totalDays / 30.4375);
  const totalYears = (totalDays / 365.25);

  // Until mission begins
  const startDays = Math.floor(msToStart / DAY);
  const startHours = Math.floor((msToStart % DAY) / 3600000);
  const startMins = Math.floor((msToStart % 3600000) / 60000);

  return (
    <section className="relative min-h-screen w-full overflow-hidden grain">
      {/* Aurora glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(80,120,255,0.10),transparent_60%)] blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="opacity-60">Goal Start</span>
              <span className="text-foreground">{IST_FMT.format(new Date(missionStart))}</span>
            </div>
            <div className="hidden md:block h-3 w-px bg-white/10" />
            <div className="hidden md:flex items-center gap-2">
              <span className="opacity-60">Goal End</span>
              <span className="text-foreground">{IST_FMT.format(new Date(missionTarget))}</span>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground transition"
            title="Edit mission dates"
          >
            <Pencil className="h-3 w-3" />
            Edit dates
          </button>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col items-center justify-center text-center relative cursor-pointer"
          onDoubleClick={() => setEditing(true)}
        >
          <div className="relative w-full">
            <div className="flex flex-col items-center justify-center px-6">
              <div className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground mb-6">
                {hasStarted ? "Mission 2029 · In Progress" : "Mission 2029 · Begins"}
              </div>

              {!hasStarted && (
                <div className="mb-6 text-[11px] uppercase tracking-[0.4em] text-foreground/80">
                  Starts in {startDays}d {startHours}h {startMins}m
                </div>
              )}

              {/* Big dual readout: Days + Minutes */}
              <div className="flex items-baseline justify-center gap-6 md:gap-10">
                <div className="flex flex-col items-center">
                  <motion.div
                    key={totalDays}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-display leading-[0.85] text-foreground tabular-nums text-[18vw] md:text-[9rem]"
                    style={{ textShadow: "0 0 60px rgba(255,255,255,0.18)" }}
                  >
                    {totalDays.toLocaleString()}
                  </motion.div>
                  <div className="mt-3 text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
                    Days
                  </div>
                </div>
                <div className="h-24 md:h-32 w-px bg-white/10" />
                <div className="flex flex-col items-center">
                  <motion.div
                    key={totalMinutes}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-display leading-[0.85] text-foreground tabular-nums text-[14vw] md:text-[7rem]"
                    style={{ textShadow: "0 0 50px rgba(255,255,255,0.14)" }}
                  >
                    {totalMinutes.toLocaleString()}
                  </motion.div>
                  <div className="mt-3 text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
                    Minutes
                  </div>
                </div>
              </div>

              {/* Secondary row — compact, evenly spaced */}
              <div className="mt-10 grid grid-cols-5 gap-x-6 md:gap-x-10">
                <Stat value={totalWeeks.toLocaleString()} label="Weeks" />
                <Stat value={totalMonths.toLocaleString()} label="Months" />
                <Stat value={totalYears.toFixed(1)} label="Years" />
                <Stat value={totalHours.toLocaleString()} label="Hours" />
                <Stat value={totalSeconds.toLocaleString()} label="Seconds" />
              </div>
            </div>
          </div>

          {/* IST window only — no live ticking clock */}
          <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-muted-foreground md:hidden">
            <span>Goal End</span>
            <span className="text-foreground">{IST_FMT.format(new Date(missionTarget))}</span>
          </div>
        </motion.div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2">
            <span>Life · Mission Progress</span>
            <span className="tabular-nums">{(consumed * 100).toFixed(3)}% consumed</span>
          </div>
          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${consumed * 100}%` }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/70 to-white"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setEditing(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass relative w-full max-w-md p-8 rounded-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    Mission Dates
                  </div>
                  <h3 className="text-display text-2xl mt-2">Edit your countdown</h3>
                </div>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full p-2 hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Start Date
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fmtYMD(missionStart)}
                      placeholder="yyyy-mm-dd"
                      onChange={(e) => {
                        const nextISO = parseYMD(e.target.value);
                        if (nextISO) patch({ missionStart: nextISO });
                      }}
                      className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-foreground outline-none focus:border-white/30 font-mono tabular-nums"
                    />
                    <input
                      type="date"
                      value={fmtYMD(missionStart)}
                      onChange={(e) => {
                        if (e.target.value) {
                          const nextISO = parseYMD(e.target.value);
                          if (nextISO) patch({ missionStart: nextISO });
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 text-foreground outline-none focus:border-white/30 cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Goal / Target Date
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fmtYMD(missionTarget)}
                      placeholder="yyyy-mm-dd"
                      onChange={(e) => {
                        const nextISO = parseYMD(e.target.value);
                        if (nextISO) patch({ missionTarget: nextISO });
                      }}
                      className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-foreground outline-none focus:border-white/30 font-mono tabular-nums"
                    />
                    <input
                      type="date"
                      value={fmtYMD(missionTarget)}
                      onChange={(e) => {
                        if (e.target.value) {
                          const nextISO = parseYMD(e.target.value);
                          if (nextISO) patch({ missionTarget: nextISO });
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 text-foreground outline-none focus:border-white/30 cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </label>
              </div>
              <button
                onClick={() => setEditing(false)}
                className="mt-6 w-full rounded-full bg-white text-black text-xs font-medium py-3 uppercase tracking-[0.3em]"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
