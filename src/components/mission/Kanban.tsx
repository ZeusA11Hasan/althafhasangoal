import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { useMission, type DailyMissionItem } from "@/lib/mission/store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { EditForm, COLORS } from "./DailyExecution";

type Status = NonNullable<DailyMissionItem["kanban"]>;

const COLUMNS: { id: Status; label: string; hint: string }[] = [
  { id: "backlog", label: "Backlog", hint: "Ideas & later" },
  { id: "today", label: "Today", hint: "Committed for today" },
  { id: "doing", label: "In Progress", hint: "Active focus" },
  { id: "done", label: "Done", hint: "Shipped" },
];

export function Kanban() {
  const { dailyMission, setKanban, addDailyMission } = useMission();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  const byCol = (s: Status) =>
    dailyMission.filter((d) => (d.kanban ?? "backlog") === s);

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              11 · Kanban Board
            </div>
            <h2 className="text-display text-4xl md:text-6xl text-foreground">
              Move work. <span className="text-muted-foreground">Ship outcomes.</span>
            </h2>
          </div>
          <button
            onClick={() =>
              addDailyMission({
                label: "New Task",
                target: 1,
                unit: "x",
                description: "",
                priority: "medium",
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                kanban: "backlog",
              })
            }
            className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/30 transition px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> New Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((c) => {
            const items = byCol(c.id);
            const isOver = overCol === c.id;
            return (
              <div
                key={c.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(c.id);
                }}
                onDragLeave={() => setOverCol((v) => (v === c.id ? null : v))}
                onDrop={() => {
                  if (dragId) setKanban(dragId, c.id);
                  setDragId(null);
                  setOverCol(null);
                }}
                className={`neu p-4 min-h-[280px] flex flex-col gap-3 transition ${
                  isOver ? "ring-1 ring-white/30 bg-white/[0.03]" : ""
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div>
                    <div className="text-sm text-foreground tracking-wide">
                      {c.label}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">
                      {c.hint}
                    </div>
                  </div>
                  <div className="text-[10px] tabular-nums text-muted-foreground">
                    {items.length}
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <KanbanCard
                      key={item.id}
                      item={item}
                      onDragStart={() => setDragId(item.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                    />
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="text-[11px] text-muted-foreground/60 italic mt-2">
                    Drop tasks here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function KanbanCard({
  item,
  onDragStart,
  onDragEnd,
}: {
  item: DailyMissionItem;
  onDragStart: () => void;
  onDragEnd: () => void;
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
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative rounded-xl bg-black/40 border border-white/[0.06] p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition"
    >
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: color }}
      />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm text-foreground truncate">{item.label}</div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition rounded p-1 hover:bg-white/[0.06] text-muted-foreground"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
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
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {item.priority && (
            <span
              className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border"
              style={{ borderColor: `${color}40`, color }}
            >
              {item.priority}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {item.target} {item.unit}
          </span>
        </div>
      </div>
    </motion.div>
  );
}