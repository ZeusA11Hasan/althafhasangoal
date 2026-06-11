import { motion, LayoutGroup } from "framer-motion";
import { useMemo, useState } from "react";
import { useMission } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Range = "days" | "weeks" | "months";

const RANGES: { id: Range; label: string }[] = [
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
];

export function PaceEngine() {
  const m = useMission();
  const [range, setRange] = useState<Range>("days");

  const totalRevenue = useMemo(
    () => Object.values(m.days).reduce((s, d) => s + (d.revenueGenerated ?? 0), 0),
    [m.days],
  );

  const data = useMemo(() => buildSeries(m.days, range), [m.days, range]);

  const delta = useMemo(() => {
    if (data.length < 2) return 0;
    const last = data[data.length - 1].value;
    const prev = data[data.length - 2].value || 1;
    return ((last - prev) / prev) * 100;
  }, [data]);

  const trendUp = delta >= 0;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-6">
          08 · Revenue
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="neu p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
                Total Revenue · So Far
              </div>
              <div className="text-display text-5xl md:text-7xl text-foreground tabular-nums leading-none">
                {fmtINR(totalRevenue)}
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span
                  className={`tabular-nums ${trendUp ? "text-success" : "text-danger"}`}
                >
                  {trendUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                </span>
                <span className="text-muted-foreground tracking-wide">
                  vs previous {range.slice(0, -1)}
                </span>
              </div>
            </div>

            <SegmentedToggle value={range} onChange={setRange} />
          </div>

          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
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
                <YAxis
                  stroke="#7A7A7A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 10000000
                      ? `${(v / 10000000).toFixed(1)}Cr`
                      : v >= 100000
                        ? `${(v / 100000).toFixed(1)}L`
                        : v >= 1000
                          ? `${Math.round(v / 1000)}k`
                          : `${v}`
                  }
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  contentStyle={{
                    background: "rgba(15,15,15,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => fmtINR(v)}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="url(#rev-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SegmentedToggle({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <LayoutGroup id="revenue-range">
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 border border-white/[0.06] backdrop-blur-md">
        {RANGES.map((r) => {
          const active = value === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onChange(r.id)}
              className={`relative px-5 py-2 text-[11px] uppercase tracking-[0.25em] rounded-full transition-colors ${
                active ? "text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="range-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function buildSeries(
  days: Record<string, { date: string; revenueGenerated: number }>,
  range: Range,
): { label: string; value: number }[] {
  const now = new Date();
  const get = (d: Date) => days[d.toISOString().slice(0, 10)]?.revenueGenerated ?? 0;

  if (range === "days") {
    const out: { label: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push({
        label: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        value: get(d),
      });
    }
    return out;
  }

  if (range === "weeks") {
    const out: { label: string; value: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      let sum = 0;
      const end = new Date(now);
      end.setDate(now.getDate() - w * 7);
      for (let i = 0; i < 7; i++) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        sum += get(d);
      }
      out.push({ label: `W-${w}`, value: sum });
    }
    return out;
  }

  const out: { label: string; value: number }[] = [];
  for (let mo = 5; mo >= 0; mo--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - mo, 1);
    let sum = 0;
    const daysInMo = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMo; i++) {
      const d = new Date(ref.getFullYear(), ref.getMonth(), i);
      sum += get(d);
    }
    out.push({
      label: ref.toLocaleDateString("en-US", { month: "short" }),
      value: sum,
    });
  }
  return out;
}