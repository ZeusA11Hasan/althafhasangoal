import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useMission } from "@/lib/mission/store";
import { Modal, Field } from "./Modal";

export function SalesChart() {
  const { days, upsertDay } = useMission();
  const [editing, setEditing] = useState<string | null>(null);

  const data = useMemo(() => {
    return Object.values(days)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        label: format(parseISO(d.date), "MMM d"),
        coldCalls: d.coldCalls,
        followUps: d.followUps,
        dealsClosed: d.dealsClosed,
      }));
  }, [days]);

  const editingDay = editing ? days[editing] : null;

  return (
    <section className="relative min-h-screen w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
            03 · Sales Performance
          </div>
          <h2 className="text-display text-5xl md:text-7xl text-foreground">
            Signal. <span className="text-muted-foreground">Not noise.</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="neu p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-6 text-xs uppercase tracking-[0.3em]">
              <Legend2 color="#ffffff" label="Cold Calls" />
              <Legend2 color="#7A7A7A" label="Follow Ups" />
              <Legend2 color="#3a3a3a" label="Deals Closed" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Click any point to edit
            </div>
          </div>

          <div style={{ width: "100%", height: 420 }}>
            <ResponsiveContainer>
              <LineChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 10, left: 0 }}
                onClick={(e: any) => {
                  if (e && e.activeLabel) {
                    const found = data.find((d) => d.label === e.activeLabel);
                    if (found) setEditing(found.date);
                  }
                }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#7A7A7A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#7A7A7A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "rgba(15,15,15,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    backdropFilter: "blur(12px)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#7A7A7A", textTransform: "uppercase", letterSpacing: 2, fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="coldCalls"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={{ fill: "#0D0D0D", stroke: "#fff", r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="followUps"
                  stroke="#7A7A7A"
                  strokeWidth={2}
                  dot={{ fill: "#0D0D0D", stroke: "#7A7A7A", r: 3, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="dealsClosed"
                  stroke="#3a3a3a"
                  strokeWidth={2}
                  dot={{ fill: "#0D0D0D", stroke: "#5a5a5a", r: 3, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editingDay ? format(parseISO(editingDay.date), "EEEE, MMMM d") : ""}
      >
        {editingDay && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Cold Calls"
              type="number"
              value={editingDay.coldCalls}
              onChange={(v) => upsertDay(editingDay.date, { coldCalls: +v })}
            />
            <Field
              label="Follow Ups"
              type="number"
              value={editingDay.followUps}
              onChange={(v) => upsertDay(editingDay.date, { followUps: +v })}
            />
            <Field
              label="Deals Closed"
              type="number"
              value={editingDay.dealsClosed}
              onChange={(v) => upsertDay(editingDay.date, { dealsClosed: +v })}
            />
          </div>
        )}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setEditing(null)}
            className="rounded-full bg-white text-black px-6 py-2.5 text-sm font-medium hover:bg-white/90"
          >
            Done
          </button>
        </div>
      </Modal>
    </section>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="h-[2px] w-6" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}