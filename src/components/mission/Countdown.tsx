import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMission } from "@/lib/mission/store";

function Cell({ value, label, mono }: { value: string; label: string; mono?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-display tabular-nums text-foreground ${
          mono ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function Countdown() {
  const { missionTarget, missionStart } = useMission();
  const target = new Date(missionTarget).getTime();
  const start = new Date(missionStart).getTime();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalRange = Math.max(1, target - start);
  const consumed = Math.max(0, Math.min(1, (now - start) / totalRange));
  const remaining = 1 - consumed;

  const ms = Math.max(0, target - now);
  const DAY = 24 * 3600 * 1000;
  const totalDays = Math.floor(ms / DAY);
  const totalHours = Math.floor(ms / (3600 * 1000));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = Math.floor(totalDays / 30.4375);
  const totalYears = (totalDays / 365.25);
  const hh = Math.floor((ms % DAY) / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  const ss = Math.floor((ms % 60000) / 1000);

  // Ring geometry
  const size = 640;
  const stroke = 2.5;
  const r = (size - stroke) / 2 - 8;
  const c = 2 * Math.PI * r;
  const off = c * (1 - remaining);

  return (
    <section className="relative min-h-screen w-full overflow-hidden grain">
      {/* Aurora glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(80,120,255,0.10),transparent_60%)] blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
              Mission 2029 · Command
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            T-Minus · {totalDays.toLocaleString()} d
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col items-center justify-center text-center relative"
        >
          {/* Circular HUD */}
          <div className="relative" style={{ width: size, height: size, maxWidth: "92vw" }}>
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="absolute inset-0 w-full h-full -rotate-90"
            >
              {/* outer faint ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={stroke}
                fill="none"
              />
              {/* progress ring */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="white"
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: off }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.5))" }}
              />
              {/* tick marks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i / 60) * Math.PI * 2;
                const x1 = size / 2 + Math.cos(angle) * (r - 14);
                const y1 = size / 2 + Math.sin(angle) * (r - 14);
                const x2 = size / 2 + Math.cos(angle) * (r - (i % 5 === 0 ? 24 : 18));
                const y2 = size / 2 + Math.sin(angle) * (r - (i % 5 === 0 ? 24 : 18));
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={i % 5 === 0 ? 1.2 : 0.6}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground mb-4">
                Mission 2029
              </div>
              <motion.div
                key={totalDays}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-display text-[28vw] md:text-[14rem] leading-[0.85] text-foreground tabular-nums"
                style={{ textShadow: "0 0 60px rgba(255,255,255,0.18)" }}
              >
                {totalDays.toLocaleString()}
              </motion.div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.5em] text-muted-foreground">
                Days Remaining
              </div>

              <div className="mt-8 flex items-center gap-6 md:gap-10">
                <Cell value={totalWeeks.toLocaleString()} label="Weeks" />
                <span className="h-6 w-px bg-white/10" />
                <Cell value={totalMonths.toLocaleString()} label="Months" />
                <span className="h-6 w-px bg-white/10" />
                <Cell value={totalYears.toFixed(1)} label="Years" />
                <span className="hidden md:block h-6 w-px bg-white/10" />
                <div className="hidden md:block">
                  <Cell value={totalHours.toLocaleString()} label="Hours" />
                </div>
              </div>
            </div>
          </div>

          {/* live HH:MM:SS underline */}
          <div className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
            <span>Live</span>
            <span className="text-foreground tabular-nums text-base">
              {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:
              {String(ss).padStart(2, "0")}
            </span>
            <span>until 10 Jun 2029</span>
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
    </section>
  );
}