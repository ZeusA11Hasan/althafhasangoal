import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMission, type DailyMissionItem } from "@/lib/mission/store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export const PRIORITIES: { id: NonNullable<DailyMissionItem["priority"]>; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "critical", label: "Critical" },
];

export const COLORS = [
  "#60a5fa",
  "#a78bfa",
  "#f43f5e",
  "#34d399",
  "#fbbf24",
  "#22d3ee",
  "#f97316",
  "#e5e7eb",
];

export function DailyExecution() {
  const { dailyMission, toggleDailyMission, addDailyMission } = useMission();
  const doneCount = dailyMission.filter((d) => d.done).length;
  const total = Math.max(1, dailyMission.length);
  const pct = (doneCount / total) * 100;

  // Sort: timed slots ascending, untimed last
  const ordered = [...dailyMission].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              02 · Today's Mission
            </div>
            <h2 className="text-display text-4xl md:text-6xl text-foreground">
              Execute. <span className="text-muted-foreground">No excuses.</span>
            </h2>
          </div>
          <div className="text-right">
            <div className="text-display text-4xl text-foreground tabular-nums">
              {doneCount}/{dailyMission.length}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Completed today
            </div>
          </div>
        </div>

        <div className="neu p-8">
          <div className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden mb-8">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/60 to-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence initial={false}>
              {ordered.map((d) => (
                <TaskRow key={d.id} item={d} onToggle={() => toggleDailyMission(d.id)} />
              ))}
            </AnimatePresence>

            <button
              onClick={() =>
                addDailyMission({
                  label: "New Task",
                  target: 1,
                  unit: "x",
                  description: "",
                  priority: "medium",
                  color: COLORS[Math.floor(Math.random() * COLORS.length)],
                  kanban: "today",
                })
              }
              className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30 transition text-sm"
            >
              <Plus className="h-4 w-4" /> Add task
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TaskRow({
  item,
  onToggle,
}: {
  item: DailyMissionItem;
  onToggle: () => void;
}) {
  const { updateDailyMission, deleteDailyMission } = useMission();
  const [open, setOpen] = useState(false);
  const color = item.color ?? "#60a5fa";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition text-left ${
        item.done
          ? "bg-white/[0.05] border-white/15"
          : "neu-inset border-transparent hover:bg-white/[0.02]"
      }`}
    >
      <button
        onClick={onToggle}
        className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center border transition ${
          item.done
            ? "bg-white text-black border-white"
            : "border-white/20 text-transparent hover:border-white/50"
        }`}
      >
        <Check className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.startTime && (
            <span className="text-[10px] tabular-nums uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/90">
              {item.startTime}
              {item.durationMinutes ? ` · ${item.durationMinutes}m` : ""}
            </span>
          )}
          <div
            className={`text-base truncate ${
              item.done ? "text-foreground/60 line-through" : "text-foreground"
            }`}
          >
            {item.label}
          </div>
          {item.priority && (
            <span
              className="text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border"
              style={{
                borderColor: `${color}40`,
                color,
              }}
            >
              {item.priority}
            </span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
          Target · {item.target} {item.unit}
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
            {item.description}
          </div>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 transition rounded-lg p-2 hover:bg-white/[0.06] text-muted-foreground"
            aria-label="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        >
          <EditForm
            item={item}
            onChange={(p) => updateDailyMission(item.id, p)}
            onDelete={() => {
              setOpen(false);
              deleteDailyMission(item.id);
            }}
          />
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

export function EditForm({
  item,
  onChange,
  onDelete,
}: {
  item: DailyMissionItem;
  onChange: (p: Partial<DailyMissionItem>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        Edit Task
      </div>
      <Field label="Title">
        <input
          value={item.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 outline-none text-foreground focus:border-white/30 transition"
        />
      </Field>
      <Field label="Description">
        <textarea
          value={item.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 outline-none text-foreground focus:border-white/30 transition resize-none text-sm"
          placeholder="Add details…"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target">
          <input
            type="number"
            value={item.target}
            onChange={(e) => onChange({ target: Number(e.target.value) || 0 })}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 outline-none text-foreground tabular-nums focus:border-white/30 transition"
          />
        </Field>
        <Field label="Unit">
          <input
            value={item.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 outline-none text-foreground focus:border-white/30 transition"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Time (IST)">
          <input
            type="time"
            value={item.startTime ?? ""}
            onChange={(e) => onChange({ startTime: e.target.value || undefined })}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 outline-none text-foreground tabular-nums focus:border-white/30 transition"
          />
        </Field>
        <Field label="Duration (min)">
          <input
            type="number"
            min={0}
            value={item.durationMinutes ?? ""}
            onChange={(e) =>
              onChange({
                durationMinutes: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 outline-none text-foreground tabular-nums focus:border-white/30 transition"
          />
        </Field>
      </div>
      <Field label="Priority">
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ priority: p.id })}
              className={`flex-1 text-[10px] uppercase tracking-[0.2em] py-2 rounded-lg border transition ${
                item.priority === p.id
                  ? "bg-white text-black border-white"
                  : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Color">
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              aria-label={`Color ${c}`}
              className={`h-7 w-7 rounded-full border-2 transition ${
                item.color === c ? "border-white scale-110" : "border-white/10"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
      <button
        onClick={onDelete}
        className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition py-2 text-xs uppercase tracking-[0.25em]"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete task
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}