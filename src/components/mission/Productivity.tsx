import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useMission, todayKey } from "@/lib/mission/store";
import { useAnalyticsData } from "@/lib/timeTracking/hooks";
import { fmtINR } from "@/lib/mission/format";

function calcStreak(days: Record<string, { hoursWorked: number; date: string }>) {
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

  // current streak ending today or yesterday
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

export function Productivity() {
  const days = useMission((s) => s.days);
  const revenueTarget = useMission((s) => s.revenueTarget);
  const currentRevenue = useMission((s) => s.currentRevenue);
  const dailyMission = useMission((s) => s.dailyMission);
  const { snapshot } = useAnalyticsData();

  const sorted = useMemo(
    () => Object.values(days).sort((a, b) => a.date.localeCompare(b.date)),
    [days],
  );

  // Chart data now comes from AnalyticsService dailyAggregates
  const data = useMemo(() => {
    if (snapshot?.dailyAggregates) {
      return snapshot.dailyAggregates.map((d) => ({
        label: format(parseISO(d.date), "MMM d"),
        hours: d.hoursWorked,
        tasks: d.completedCount,
        revenue: d.revenue,
      }));
    }
    // Fallback to legacy day data
    return sorted.map(
      (d: {
        date: string;
        hoursWorked: number;
        tasksCompleted: number;
        revenueGenerated: number;
      }) => ({
        label: format(parseISO(d.date), "MMM d"),
        hours: d.hoursWorked,
        tasks: d.tasksCompleted,
        revenue: d.revenueGenerated,
      }),
    );
  }, [snapshot, sorted]);

  const today = days[todayKey()];

  // All KPIs now derive from AnalyticsService snapshot first, then fallback
  const dailyHours = snapshot?.dailyHours ?? today?.hoursWorked ?? 0;
  const weeklyHours =
    snapshot?.weeklyHours ??
    sorted.slice(-7).reduce((s: number, d: { hoursWorked: number }) => s + d.hoursWorked, 0);
  const monthlyHours =
    snapshot?.monthlyHours ??
    sorted.slice(-30).reduce((s: number, d: { hoursWorked: number }) => s + d.hoursWorked, 0);

  const totalTasks =
    snapshot?.totalTasks ??
    sorted.reduce(
      (s: number, d: { tasksCompleted: number; tasksCancelled: number }) =>
        s + d.tasksCompleted + d.tasksCancelled,
      0,
    );
  const completed = snapshot?.totalTasks
    ? Math.round((snapshot.completionRate / 100) * snapshot.totalTasks)
    : sorted.reduce((s: number, d: { tasksCompleted: number }) => s + d.tasksCompleted, 0);
  const completionRate =
    snapshot?.completionRate ?? (totalTasks ? (completed / totalTasks) * 100 : 0);
  const deepWork =
    snapshot?.deepWorkHours ??
    sorted.reduce((s: number, d: { hoursWorked: number }) => s + Math.max(0, d.hoursWorked - 2), 0);

  const streak = snapshot?.streak ?? calcStreak(days);

  // Founder Score
  const revPct = revenueTarget > 0 ? Math.min(1, currentRevenue / revenueTarget) : 0;
  const score = Math.round(
    Math.min(100, dailyHours * 6) * 0.25 +
      Math.min(100, (today?.tasksCompleted ?? 0) * 12) * 0.2 +
      Math.min(100, (today?.coldCalls ?? 0) * 4) * 0.2 +
      Math.min(100, (today?.followUps ?? 0) * 6) * 0.1 +
      revPct * 100 * 0.25,
  );

  return (
    <section className="relative min-h-screen w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
            05 · Founder Operating System
          </div>
          <h2 className="text-display text-5xl md:text-7xl text-foreground">
            Discipline. <span className="text-muted-foreground">Compounded.</span>
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Founder score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="neu p-8 col-span-12 lg:col-span-5 flex flex-col justify-between"
          >
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Founder Score · Today
            </div>
            <div className="my-6 flex items-end gap-3">
              <div className="text-display text-[10rem] leading-[0.85] text-foreground tabular-nums">
                {score}
              </div>
              <div className="text-display text-3xl text-muted-foreground pb-4">/ 100</div>
            </div>
            <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-white"
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Mini label="Hours" value={dailyHours.toFixed(1)} />
              <Mini label="Calls" value={`${today?.coldCalls ?? 0}`} />
              <Mini label="Tasks" value={`${today?.tasksCompleted ?? 0}`} />
            </div>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="neu p-8 col-span-12 lg:col-span-7 flex flex-col justify-between"
          >
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Streak · Don't break the chain
            </div>
            <div className="my-6 grid grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Current
                </div>
                <div className="text-display text-7xl text-foreground tabular-nums">
                  {streak.current}
                  <span className="text-2xl text-muted-foreground ml-2">days</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Best
                </div>
                <div className="text-display text-7xl text-muted-foreground tabular-nums">
                  {streak.best}
                  <span className="text-2xl ml-2">days</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              {sorted.slice(-30).map((d, i) => (
                <div
                  key={i}
                  className="flex-1 h-8 rounded-md"
                  style={{
                    background:
                      d.hoursWorked > 0
                        ? `rgba(255,255,255,${0.2 + Math.min(0.8, d.hoursWorked / 10)})`
                        : "rgba(255,255,255,0.04)",
                  }}
                />
              ))}
            </div>
          </motion.div>

          <Stat3 label="Daily Hours" value={dailyHours.toFixed(1)} unit="h" />
          <Stat3 label="Weekly Hours" value={weeklyHours.toFixed(1)} unit="h" />
          <Stat3 label="Monthly Hours" value={monthlyHours.toFixed(0)} unit="h" />
          <Stat3 label="Completion" value={completionRate.toFixed(0)} unit="%" />
          <Stat3 label="Deep Work" value={deepWork.toFixed(0)} unit="h" />
          <Stat3 label="Tasks Done" value={`${completed}`} unit="" />

          {/* Charts */}
          <Chart title="Hours vs Date" col="col-span-12 lg:col-span-4">
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#7A7A7A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#7A7A7A" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip {...chartTip} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Tasks Completed" col="col-span-12 lg:col-span-4">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#7A7A7A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#7A7A7A" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip {...chartTip} />
                <Bar dataKey="tasks" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Revenue vs Date" col="col-span-12 lg:col-span-4">
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#7A7A7A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#7A7A7A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip {...chartTip} formatter={(v: number) => fmtINR(v)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="url(#g2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Chart>
        </div>
      </div>
    </section>
  );
}

const chartTip = {
  cursor: { stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 },
  contentStyle: {
    background: "rgba(15,15,15,0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: {
    color: "#7A7A7A",
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    fontSize: 10,
  },
};

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu-inset py-3">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-display text-xl text-foreground tabular-nums mt-1">{value}</div>
    </div>
  );
}

function Stat3({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="neu p-5 col-span-6 lg:col-span-2"
    >
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-display text-3xl text-foreground tabular-nums mt-2">
        {value}
        <span className="text-base text-muted-foreground ml-1">{unit}</span>
      </div>
    </motion.div>
  );
}

function Chart({
  title,
  col,
  children,
}: {
  title: string;
  col: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className={`neu p-6 ${col}`}
    >
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
        {title}
      </div>
      <div style={{ width: "100%", height: 200 }}>{children}</div>
    </motion.div>
  );
}
