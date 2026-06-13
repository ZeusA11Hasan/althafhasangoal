import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
} from "date-fns";
import { useMission } from "@/lib/mission/store";

type Gran = "day" | "week" | "month";

const COLORS = [
  "#ffffff",
  "#60a5fa",
  "#a78bfa",
  "#f43f5e",
  "#34d399",
  "#fbbf24",
  "#22d3ee",
  "#f97316",
  "#e879f9",
  "#94a3b8",
];

function bucketKey(date: string, g: Gran) {
  const d = parseISO(date);
  if (g === "day") return date;
  if (g === "week") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(startOfMonth(d), "yyyy-MM");
}

function bucketLabel(key: string, g: Gran) {
  if (g === "month") return format(parseISO(key + "-01"), "MMM yy");
  return format(parseISO(key), g === "week" ? "MMM d" : "MMM d");
}

export function TaskHoursChart() {
  const { days } = useMission();
  const [gran, setGran] = useState<Gran>("day");

  const { data, taskNames } = useMemo(() => {
    const names = new Set<string>();
    const buckets = new Map<string, Record<string, number>>();

    Object.values(days).forEach((day) => {
      const k = bucketKey(day.date, gran);
      if (!buckets.has(k)) buckets.set(k, {});
      const row = buckets.get(k)!;
      day.tasks.forEach((t) => {
        const title = t.title.trim() || "Untitled";
        names.add(title);
        row[title] = (row[title] ?? 0) + (t.actualHours || 0);
      });
    });

    const data = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, row]) => ({ key: k, label: bucketLabel(k, gran), ...row }));

    return { data, taskNames: Array.from(names) };
  }, [days, gran]);

  const empty = taskNames.length === 0;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              06 · Hours Per Task
            </div>
            <h2 className="text-display text-4xl md:text-6xl text-foreground">
              Where time <span className="text-muted-foreground">actually went.</span>
            </h2>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1 self-start md:self-end">
            {(["day", "week", "month"] as Gran[]).map((g) => (
              <button
                key={g}
                onClick={() => setGran(g)}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] rounded-full transition ${
                  gran === g
                    ? "bg-white text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g}s
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="neu p-6 md:p-8"
        >
          {empty ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="text-sm">No tracked task hours yet.</div>
              <div className="text-[11px] mt-2 uppercase tracking-[0.3em]">
                Add tasks in the Mission Calendar to populate this chart.
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-[10px] uppercase tracking-[0.3em]">
                {taskNames.map((name, i) => (
                  <div key={name} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-foreground/80">{name}</span>
                  </div>
                ))}
              </div>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      tickLine={false}
                      label={{
                        value: "hours",
                        angle: -90,
                        position: "insideLeft",
                        fill: "rgba(255,255,255,0.4)",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    />
                    {taskNames.map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}