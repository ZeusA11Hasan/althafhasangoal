import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMission, todayKey } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";

function useAnimatedNumber(value: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = n;
    const dur = 800;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return n;
}

function MetricCard({
  label,
  value,
  unit,
  sub,
  formatter,
  delay = 0,
}: {
  label: string;
  value: number;
  unit?: string;
  sub?: string;
  formatter?: (n: number) => string;
  delay?: number;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="neu p-6 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/[0.02] blur-2xl" />
      <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-display text-4xl text-foreground tabular-nums">
          {formatter ? formatter(animated) : Math.round(animated).toLocaleString()}
        </div>
        {unit && (
          <div className="text-sm text-muted-foreground uppercase tracking-widest">
            {unit}
          </div>
        )}
      </div>
      {sub && (
        <div className="mt-2 text-[11px] text-muted-foreground tracking-wide">{sub}</div>
      )}
    </motion.div>
  );
}

export function Metrics() {
  const m = useMission();
  const today = m.days[todayKey()];

  const last7 = Object.values(m.days)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const sleepAvg =
    last7.reduce((s, d) => s + (d.sleepHours ?? 7.2), 0) / Math.max(1, last7.length);
  const workoutStreak = (() => {
    let n = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      if (m.days[k]?.workoutDone) n++;
      else break;
    }
    return n;
  })();
  const readingMin = today?.readingMinutes ?? 25;
  const deepWork = today?.deepWorkHours ?? Math.max(0, (today?.hoursWorked ?? 0) - 2);
  const outreach = today?.outreachSent ?? today?.coldCalls ?? 0;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
            06 · Founder Vitals
          </div>
          <h2 className="text-display text-4xl md:text-6xl text-foreground">
            Eight signals. <span className="text-muted-foreground">Zero noise.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Deep Work"
            value={deepWork}
            unit="hrs"
            sub="Today · uninterrupted"
            formatter={(n) => n.toFixed(1)}
          />
          <MetricCard
            label="Workout Streak"
            value={workoutStreak}
            unit="days"
            sub="Don't break the chain"
            delay={0.05}
          />
          <MetricCard
            label="Revenue · Month"
            value={m.monthlyRevenue}
            sub="Target ₹1Cr/mo by Jun 2029"
            formatter={(n) => fmtINR(n)}
            delay={0.1}
          />
          <MetricCard
            label="Sales Calls"
            value={today?.coldCalls ?? 0}
            unit="today"
            sub="Activity drives outcomes"
            delay={0.15}
          />
          <MetricCard
            label="Outreach Sent"
            value={outreach}
            unit="msgs"
            sub="Volume = velocity"
            delay={0.2}
          />
          <MetricCard
            label="Tasks Completed"
            value={today?.tasksCompleted ?? 0}
            sub="Done > perfect"
            delay={0.25}
          />
          <MetricCard
            label="Reading"
            value={readingMin}
            unit="min"
            sub="Compound your mind"
            delay={0.3}
          />
          <MetricCard
            label="Sleep Avg · 7d"
            value={sleepAvg}
            unit="hrs"
            sub="Recovery is a weapon"
            formatter={(n) => n.toFixed(1)}
            delay={0.35}
          />
        </div>
      </div>
    </section>
  );
}