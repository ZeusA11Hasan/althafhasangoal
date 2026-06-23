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
import { ChevronLeft, ChevronRight, X, Check, Plus, Clock } from "lucide-react";
import { useMission, type DayEntry, type DailyMissionItem } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";
import { Field } from "./Modal";
import { Pomodoro } from "./Pomodoro";
import { TaskHoursChart } from "./TaskHoursChart";
import { PALETTE, PRIORITY_IDS } from "@/lib/mission/constants";

function intensity(d?: DayEntry) {
  if (!d) return 0;
  return Math.max(0, Math.min(1, d.hoursWorked / 10));
}

function bg(level: number) {
  if (level === 0) return "rgba(255,255,255,0.025)";
  const a = 0.15 + level * 0.85;
  return `rgba(255,255,255,${a})`;
}

// ──────────────────────────────────────────────────────────────────────────
export function Calendar() {
  const days = useMission((s) => s.days);
  const selectedDate = useMission((s) => s.selectedDate);
  const setSelectedDate = useMission((s) => s.setSelectedDate);
  const upsertDay = useMission((s) => s.upsertDay);
  const [cursor, setCursor] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                  onClick={() => {
                    setSelectedDate(key);
                    setIsModalOpen(true);
                  }}
                  className={`relative aspect-square rounded-xl border transition ${inMonth
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
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 md:p-10 border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] flex flex-col"
            >
              <DayDrawer
                date={selectedDate}
                onClose={() => setIsModalOpen(false)}
                onSave={(p) => upsertDay(selectedDate, p)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Day Drawer ────────────────────────────────────────────────────────────
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

  const [tab, setTab] = useState<"log" | "timer" | "tasks" | "analytics">("log");

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
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition">
          <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8 border-b border-white/5 pb-4">
        <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1">
          {([
            { id: "log", label: "Daily Log" },
            { id: "timer", label: "Focus Timer" },
            { id: "tasks", label: "To-Do List" },
            { id: "analytics", label: "Analytics" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] rounded-full transition ${tab === t.id
                ? "bg-white text-black font-semibold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "log" && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                  rows={4}
                  placeholder="What moved the mission today?"
                  className="rounded-xl bg-black/40 border border-white/5 px-4 py-3 outline-none focus:border-white/20 text-foreground placeholder:text-muted-foreground/50 resize-none transition"
                />
              </label>

              <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Today's Revenue: <span className="text-foreground">{fmtINR(day.revenueGenerated)}</span>
              </div>
            </div>
          )}

          {tab === "timer" && (
            <div className="p-1">
              <Pomodoro date={date} compact={false} />
            </div>
          )}

          {tab === "tasks" && (
            <div className="p-1">
              <DailyMissionList date={date} />
            </div>
          )}

          {tab === "analytics" && (
            <div className="p-1">
              <TaskHoursChart date={date} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Daily Mission List ────────────────────────────────────────────────────
function DailyMissionList({ date }: { date: string }) {
  const days = useMission((s) => s.days);
  const defaultMissions = useMission((s) => s.dailyMission);
  const toggleDailyMission = useMission((s) => s.toggleDailyMission);
  const addDailyMission = useMission((s) => s.addDailyMission);
  const updateDailyMission = useMission((s) => s.updateDailyMission);
  const deleteDailyMission = useMission((s) => s.deleteDailyMission);

  const [adding, setAdding] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const day = days[date];
  const activeMissions = day?.dailyMission ?? defaultMissions;

  const ordered = [...activeMissions].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });

  function handleAdd() {
    if (!newLabel.trim()) return;
    addDailyMission(date, {
      label: newLabel.trim(),
      startTime: newTime || undefined,
      target: 1,
      unit: "x",
      description: "",
      priority: "medium",
      color: "#60a5fa",
      kanban: "today",
    });
    setNewTime("");
    setNewLabel("");
    setAdding(false);
  }

  function handleCancel() {
    setNewTime("");
    setNewLabel("");
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          To-Do List · Timing Allotments
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
        )}
      </div>

      {/* Inline add form – time first, then task name */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/15 bg-white/[0.04]">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                autoFocus
                className="bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-[12px] tabular-nums text-foreground/90 outline-none focus:border-white/40 transition w-[100px] cursor-pointer"
                style={{ colorScheme: "dark" }}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    (e.currentTarget.nextElementSibling as HTMLInputElement | null)?.focus();
                  }
                }}
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Task name…"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <button
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition disabled:opacity-30"
              >
                <Check className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={handleCancel}
                className="h-7 w-7 rounded-full hover:bg-white/5 flex items-center justify-center transition text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1 px-1 text-[10px] text-muted-foreground/60 tracking-wide">
              Enter time → Tab → task name → Enter to save · Esc to cancel
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {ordered.map((item) => (
          <TaskRow
            key={item.id}
            item={item}
            onToggle={() => toggleDailyMission(date, item.id)}
            onUpdate={(patch) => updateDailyMission(date, item.id, patch)}
            onDelete={() => deleteDailyMission(date, item.id)}
          />
        ))}
        {ordered.length === 0 && !adding && (
          <div className="text-xs text-muted-foreground italic text-center py-6">
            No mission items yet. Hit "Add Task" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Row + Edit Modal ─────────────────────────────────────────────────
function TaskRow({
  item,
  onToggle,
  onUpdate,
  onDelete,
}: {
  item: DailyMissionItem;
  onToggle: () => void;
  onUpdate: (p: Partial<DailyMissionItem>) => void;
  onDelete: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const color = item.color ?? "#60a5fa";

  return (
    <>
      {/* ── Read-only row ── */}
      <div
        className={`group flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${item.done
          ? "bg-white/[0.05] border-white/15"
          : "neu-inset border-transparent hover:border-white/10"
          }`}
        onClick={() => setEditOpen(true)}
      >
        {/* Checkbox – stop propagation so clicking it only toggles */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center border transition ${item.done
            ? "bg-white text-black border-white"
            : "border-white/20 text-transparent hover:border-white/50"
            }`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>

        {/* Time badge with clock icon */}
        <span className="flex items-center gap-1 text-[11px] tabular-nums text-foreground/50 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-0.5 shrink-0 min-w-[72px]">
          <Clock className="h-3 w-3 opacity-60 shrink-0" />
          {item.startTime ?? "--:--"}
        </span>

        {/* Label */}
        <span
          className={`flex-1 text-sm truncate ${item.done ? "text-foreground/50 line-through" : "text-foreground"
            }`}
        >
          {item.label}
        </span>

        {/* Priority pill */}
        {item.priority && (
          <span
            className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border shrink-0"
            style={{ borderColor: `${color}40`, color }}
          >
            {item.priority}
          </span>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setEditOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl" />

            {/* Panel */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl border border-white/[0.09] bg-[#0c0c0e]/95 backdrop-blur-3xl shadow-[0_40px_100px_-12px_rgba(0,0,0,0.97)] p-7 flex flex-col gap-5 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Edit Task
                </span>
                <button
                  onClick={() => setEditOpen(false)}
                  className="rounded-full p-1.5 hover:bg-white/5 transition text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Title
                </label>
                <input
                  value={item.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/30 transition"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={item.description ?? ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  rows={3}
                  placeholder="What does this task involve?"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-white/30 transition resize-none"
                />
              </div>

              {/* Target + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Target
                  </label>
                  <input
                    type="number"
                    value={item.target}
                    min={0}
                    onChange={(e) => onUpdate({ target: +e.target.value })}
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/30 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Unit
                  </label>
                  <input
                    value={item.unit}
                    onChange={(e) => onUpdate({ unit: e.target.value })}
                    placeholder="msgs / hrs"
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-white/30 transition"
                  />
                </div>
              </div>

              {/* Start Time + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Start Time (IST)
                  </label>
                  <input
                    type="time"
                    value={item.startTime ?? ""}
                    onChange={(e) =>
                      onUpdate({ startTime: e.target.value || undefined })
                    }
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/30 transition cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={item.durationMinutes ?? ""}
                    min={0}
                    onChange={(e) =>
                      onUpdate({
                        durationMinutes: e.target.value ? +e.target.value : undefined,
                      })
                    }
                    placeholder="—"
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-white/30 transition"
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Priority
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITY_IDS.map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdate({ priority: p })}
                      className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[0.2em] transition ${item.priority === p
                        ? "bg-white text-black border-white font-semibold"
                        : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color swatches */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Color
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ color: c })}
                      className="h-8 w-8 rounded-full transition hover:scale-110 active:scale-95"
                      style={{
                        background: c,
                        boxShadow:
                          item.color === c
                            ? `0 0 0 2px #0c0c0e, 0 0 0 4px ${c}`
                            : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => {
                  onDelete();
                  setEditOpen(false);
                }}
                className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 py-2.5 text-[11px] uppercase tracking-[0.3em] text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition"
              >
                🗑 Delete Task
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}