import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMission } from "@/lib/mission/store";

interface Parts {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function diff(target: number, now: number): Parts {
  let ms = Math.max(0, target - now);
  const totalMs = ms;
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HR = 60 * MIN;
  const DAY = 24 * HR;
  // approximate years/months from days
  const totalDays = Math.floor(ms / DAY);
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays - years * 365) / 30);
  const days = totalDays - years * 365 - months * 30;
  ms -= totalDays * DAY;
  const hours = Math.floor(ms / HR);
  ms -= hours * HR;
  const minutes = Math.floor(ms / MIN);
  ms -= minutes * MIN;
  const seconds = Math.floor(ms / SEC);
  return { years, months, days, hours, minutes, seconds, totalMs };
}

function Cell({ label, value, big }: { label: string; value: number; big?: boolean }) {
  const v = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-display ${
          big ? "text-[18vw] md:text-[10vw] lg:text-[9rem]" : "text-5xl md:text-7xl"
        } leading-none text-foreground tabular-nums`}
      >
        {v}
      </div>
      <div className="mt-2 text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground">
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

  const p = diff(target, now);
  const totalRange = Math.max(1, target - start);
  const consumed = Math.max(0, Math.min(1, (now - start) / totalRange));
  const remaining = 1 - consumed;

  return (
    <section className="relative min-h-screen w-full overflow-hidden grain">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[60vh] w-[80vw] rounded-full bg-white/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
            <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Mission 2029
            </span>
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Target · 10 Jun 2029
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="text-xs uppercase tracking-[0.5em] text-muted-foreground mb-6">
            Time Remaining
          </div>

          <div className="flex items-end justify-center gap-6 md:gap-10">
            <Cell label="Years" value={p.years} big />
            <div className="text-display text-7xl md:text-9xl text-muted-foreground/40 pb-4">·</div>
            <Cell label="Months" value={p.months} big />
          </div>

          <div className="mt-10 grid grid-cols-4 gap-3 md:gap-10 w-full max-w-3xl">
            <Cell label="Days" value={p.days} />
            <Cell label="Hours" value={p.hours} />
            <Cell label="Minutes" value={p.minutes} />
            <Cell label="Seconds" value={p.seconds} />
          </div>

          <p className="mt-12 max-w-xl text-sm md:text-base text-muted-foreground italic">
            "Every second is either building your future or destroying it."
          </p>
        </motion.div>

        <div className="mt-10">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            <span>Mission Progress</span>
            <span>{(consumed * 100).toFixed(4)}% consumed</span>
          </div>
          <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${consumed * 100}%` }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 bg-white"
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>Consumed {(consumed * 100).toFixed(2)}%</span>
            <span>Remaining {(remaining * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}