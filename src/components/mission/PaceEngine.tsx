import { motion } from "framer-motion";
import { useMission } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Pencil } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { differenceInMonths } from "date-fns";

export function PaceEngine() {
  const m = useMission();
  const current = Math.max(1, m.monthlyRevenue);
  const target = Math.max(current + 1, m.monthlyTarget);
  const months = Math.max(1, differenceInMonths(new Date(m.missionTarget), new Date()));
  const g = Math.pow(target / current, 1 / months) - 1;

  const [amountStr, setAmountStr] = useState(String(m.monthlyTarget));
  const [dateStr, setDateStr] = useState(m.missionTarget.slice(0, 10));

  const formatTargetHeadline = (n: number) => {
    if (n >= 10000000) {
      const cr = n / 10000000;
      return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr / month`;
    }
    if (n >= 100000) {
      const l = n / 100000;
      return `₹${l % 1 === 0 ? l : l.toFixed(2)} L / month`;
    }
    return `${fmtINR(n)} / month`;
  };

  const targetDateLabel = new Date(m.missionTarget).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const data = Array.from({ length: months + 1 }).map((_, i) => ({
    m: i,
    required: Math.round(current * Math.pow(1 + g, i)),
  }));

  const status =
    m.monthlyRevenue >= 10000000
      ? { label: "AHEAD", color: "text-success" }
      : m.monthlyRevenue >= 1000000
        ? { label: "ON TRACK", color: "text-foreground" }
        : m.monthlyRevenue >= 100000
          ? { label: "AT RISK", color: "text-warning" }
          : { label: "BEHIND", color: "text-danger" };

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              08 · Financial Pace Engine
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="group text-left">
                  <h2 className="text-display text-4xl md:text-6xl text-foreground inline-flex items-center gap-3 cursor-pointer transition-colors hover:text-foreground/80">
                    {formatTargetHeadline(m.monthlyTarget)}{" "}
                    <span className="text-muted-foreground">by {targetDateLabel}.</span>
                    <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </h2>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
              >
                <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-4">
                  Edit Mission Goal
                </div>
                <div className="space-y-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Target Monthly Revenue (₹)
                    </span>
                    <input
                      type="number"
                      value={amountStr}
                      onChange={(e) => {
                        setAmountStr(e.target.value);
                        const n = Number(e.target.value);
                        if (!Number.isNaN(n) && n > 0) m.setField("monthlyTarget", n);
                      }}
                      className="rounded-xl bg-black/60 border border-white/10 px-4 py-3 outline-none text-foreground tabular-nums focus:border-white/30 transition"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTargetHeadline(Number(amountStr) || 0)}
                    </span>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Target Date
                    </span>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => {
                        setDateStr(e.target.value);
                        if (e.target.value) {
                          m.setField(
                            "missionTarget",
                            new Date(e.target.value).toISOString(),
                          );
                        }
                      }}
                      className="rounded-xl bg-black/60 border border-white/10 px-4 py-3 outline-none text-foreground tabular-nums focus:border-white/30 transition [color-scheme:dark]"
                    />
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className={`text-display text-xl tracking-[0.3em] ${status.color}`}>
            ● {status.label}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div className="space-y-4">
            <Box label="Current Monthly Revenue" value={fmtINR(m.monthlyRevenue)} accent />
            <Box label="Required Growth Rate" value={`${(g * 100).toFixed(1)}% / mo`} />
            <Box label="Gap to Target" value={fmtINR(Math.max(0, target - m.monthlyRevenue))} />
            <Box label="Months Remaining" value={`${months}`} />
            <div className="neu p-5">
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
                Required Trajectory
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">₹1L / month</span>
                  <span className="tabular-nums text-foreground">Feb 2027</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">₹10L / month</span>
                  <span className="tabular-nums text-foreground">Feb 2028</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">₹1Cr / month</span>
                  <span className="tabular-nums text-foreground">Jun 2029</span>
                </li>
              </ul>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="neu p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Compounding Path · Monthly Revenue
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {months} months · log scale
              </div>
            </div>
            <div style={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="pace" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="m"
                    stroke="#7A7A7A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `+${v}m`}
                  />
                  <YAxis
                    stroke="#7A7A7A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    scale="log"
                    domain={[current, target]}
                    tickFormatter={(v) =>
                      v >= 10000000
                        ? `${v / 10000000}Cr`
                        : v >= 100000
                          ? `${v / 100000}L`
                          : `${Math.round(v / 1000)}k`
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
                  <ReferenceLine
                    y={100000}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    y={1000000}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    y={10000000}
                    stroke="rgba(255,255,255,0.4)"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="required"
                    stroke="#fff"
                    strokeWidth={2}
                    fill="url(#pace)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Box({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="neu p-5">
      <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-display tabular-nums mt-2 ${
          accent ? "text-4xl text-foreground" : "text-2xl text-foreground/90"
        }`}
      >
        {value}
      </div>
    </div>
  );
}