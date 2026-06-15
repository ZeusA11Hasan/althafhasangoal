import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  addDays,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  subMonths,
  addMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMission, type DayEntry } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";
import { Field } from "./Modal";
import { Check, Plus } from "lucide-react";

function intensity(d?: DayEntry) {
  if (!d) return 0;
  // Intensity is purely a function of hours worked (0h → empty, 10h → max).
  return Math.max(0, Math.min(1, d.hoursWorked / 10));
}

function bg(level: number) {
  if (level === 0) return "rgba(255,255,255,0.025)";
  const a = 0.15 + level * 0.85;
  return `rgba(255,255,255,${a})`;
}

export function Calendar() {
  const { days, upsertDay } = useMission();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [cursor]);

  const selectedDay = selected ? days[selected] : null;

  return (
    <section className="relative min-h-screen w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              04 · Mission Calendar
            </div>
            <h2 className="text-display text-5xl md:text-7xl text-foreground">
              {format(cursor, "MMMM")}{" "}
              <span className="text-muted-foreground">{format(cursor, "yyyy")}</span>
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCursor(subMonths(cursor, 1))}
              className="neu p-3 hover:bg-white/[0.03] transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="neu p-3 hover:bg-white/[0.03] transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="neu p-6">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
              <div
                key={d}
                className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {grid.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const day = days[key];
              const lvl = intensity(day);
              const inMonth = isSameMonth(d, cursor);
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(key)}
                  className={`relative aspect-square rounded-xl border transition ${
                    inMonth
                      ? "border-white/[0.05]"
                      : "border-transparent opacity-30"
                  }`}
                  style={{ background: bg(lvl) }}
                >
                  <div className="absolute top-2 left-2 text-[11px] tabular-nums text-foreground/90 font-medium">
                    {format(d, "d")}
                  </div>
                  {day && day.hoursWorked > 0 && (
                    <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-wider text-foreground/70">
                      {day.hoursWorked.toFixed(1)}h
                    </div>
                  )}
                  {day && day.dealsClosed > 0 && (
                    <div className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                  )}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>Less</span>
            {[0, 0.2, 0.45, 0.7, 1].map((l, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-md border border-white/5"
                style={{ background: bg(l) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Centered glass modal */}
      <AnimatePresence>
        {selected && selectedDay !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
          >
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-xl"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
            >
              <DayDrawer
                date={selected}
                onClose={() => setSelected(null)}
                onSave={(p) => upsertDay(selected, p)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DayDrawer({
  date,
  onClose,
  onSave,
}: {
  date: string;
  onClose: () => void;
  onSave: (p: Partial<DayEntry>) => void;
}) {
  const day = useMission((s) => s.days[date]) ?? {
    date,
    hoursWorked: 0,
    tasksCompleted: 0,
    tasksCancelled: 0,
    revenueGenerated: 0,
    coldCalls: 0,
    followUps: 0,
    dealsClosed: 0,
    notes: "",
    tasks: [],
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            {format(parseISO(date), "EEEE")}
          </div>
          <h3 className="text-display text-4xl text-foreground mt-2">
            {format(parseISO(date), "MMMM d, yyyy")}
          </h3>
        </div>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Field
          label="Hours Worked"
          type="number"
          value={day.hoursWorked}
          onChange={(v) => onSave({ hoursWorked: +v })}
        />
        <Field
          label="Revenue (₹)"
          type="number"
          value={day.revenueGenerated}
          onChange={(v) => onSave({ revenueGenerated: +v })}
        />
        <Field
          label="Cold Calls"
          type="number"
          value={day.coldCalls}
          onChange={(v) => onSave({ coldCalls: +v })}
        />
        <Field
          label="Follow Ups"
          type="number"
          value={day.followUps}
          onChange={(v) => onSave({ followUps: +v })}
        />
        <Field
          label="Deals Closed"
          type="number"
          value={day.dealsClosed}
          onChange={(v) => onSave({ dealsClosed: +v })}
        />
        <Field
          label="Tasks Cancelled"
          type="number"
          value={day.tasksCancelled}
          onChange={(v) => onSave({ tasksCancelled: +v })}
        />
      </div>

      <label className="flex flex-col gap-2 mb-8">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Daily Notes
        </span>
        <textarea
          value={day.notes}
          onChange={(e) => onSave({ notes: e.target.value })}
          rows={3}
          placeholder="What moved the mission today?"
          className="rounded-xl bg-black/40 border border-white/5 px-4 py-3 outline-none focus:border-white/20 text-foreground placeholder:text-muted-foreground/50 resize-none"
        />
      </label>

      <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        Today's Revenue: <span className="text-foreground">{fmtINR(day.revenueGenerated)}</span>
      </div>

      <DailyMissionList />
    </div>
  );
}

function DailyMissionList() {
  const {
    dailyMission,
    toggleDailyMission,
    addDailyMission,
    updateDailyMission,
    deleteDailyMission,
  } = useMission();

  const ordered = [...dailyMission].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          Today's Mission · synced with main page
        </div>
        <button
          onClick={() =>
            addDailyMission({
              label: "New Task",
              target: 1,
              unit: "x",
              description: "",
              priority: "medium",
              color: "#60a5fa",
              kanban: "today",
            })
          }
          className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {ordered.map((item) => {
          const color = item.color ?? "#60a5fa";
          return (
            <div
              key={item.id}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition ${
                item.done
                  ? "bg-white/[0.05] border-white/15"
                  : "neu-inset border-transparent"
              }`}
            >
              <button
                onClick={() => toggleDailyMission(item.id)}
                className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center border transition ${
                  item.done
                    ? "bg-white text-black border-white"
                    : "border-white/20 text-transparent hover:border-white/50"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.startTime && (
                    <span className="text-[9px] tabular-nums uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {item.startTime}
                    </span>
                  )}
                  <input
                    value={item.label}
                    onChange={(e) => updateDailyMission(item.id, { label: e.target.value })}
                    className={`bg-transparent outline-none text-sm flex-1 ${
                      item.done ? "text-foreground/60 line-through" : "text-foreground"
                    }`}
                  />
                  {item.priority && (
                    <span
                      className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full border"
                      style={{ borderColor: `${color}40`, color }}
                    >
                      {item.priority}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteDailyMission(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger text-xs px-2"
              >
                ✕
              </button>
            </div>
          );
        })}
        {ordered.length === 0 && (
          <div className="text-xs text-muted-foreground italic text-center py-6">
            No mission items yet.
          </div>
        )}
      </div>
    </div>
  );
}