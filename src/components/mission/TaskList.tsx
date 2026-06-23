import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Plus, Trash2 } from "lucide-react";
import { useMission, type Task, type TaskPriority, type TaskStatus } from "@/lib/mission/store";

const PRIORITY: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground/80",
  high: "text-warning",
  critical: "text-danger",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function LiveTimer({ task }: { task: Task }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!task.timerRunning) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [task.timerRunning]);
  const live =
    task.accumulatedMs +
    (task.timerRunning && task.timerStartedAt ? Date.now() - task.timerStartedAt : 0);
  return <span className="tabular-nums">{formatMs(live)}</span>;
}

export function TaskList({ date }: { date: string }) {
  const days = useMission((s) => s.days);
  const addTask = useMission((s) => s.addTask);
  const updateTask = useMission((s) => s.updateTask);
  const deleteTask = useMission((s) => s.deleteTask);
  const startTimer = useMission((s) => s.startTimer);
  const pauseTimer = useMission((s) => s.pauseTimer);
  const stopTimer = useMission((s) => s.stopTimer);
  const tasks = days[date]?.tasks ?? [];
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    estimatedHours: 1,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          Tasks · {tasks.length}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add task
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="neu-inset p-4 mb-4 space-y-3"
          >
            <input
              autoFocus
              placeholder="Task title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full bg-transparent outline-none text-foreground text-base placeholder:text-muted-foreground/50"
            />
            <textarea
              placeholder="Description (optional)"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className="w-full bg-transparent outline-none text-sm text-foreground/80 placeholder:text-muted-foreground/50 resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as TaskPriority })
                }
                className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="number"
                value={draft.estimatedHours}
                onChange={(e) =>
                  setDraft({ ...draft, estimatedHours: +e.target.value })
                }
                className="w-20 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none tabular-nums"
              />
              <span className="text-xs text-muted-foreground">est. hours</span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="text-xs text-muted-foreground hover:text-foreground px-3"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!draft.title.trim()) return;
                    addTask(date, { ...draft, status: "todo" });
                    setDraft({
                      title: "",
                      description: "",
                      priority: "medium",
                      estimatedHours: 1,
                    });
                    setAdding(false);
                  }}
                  className="rounded-full bg-white text-black text-xs font-medium px-4 py-1.5"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {tasks.length === 0 && !adding && (
          <div className="text-xs text-muted-foreground italic text-center py-8">
            No tasks for this day yet.
          </div>
        )}
        {tasks.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="neu-inset p-4"
          >
            <div className="flex items-start gap-3">
              <select
                value={t.status}
                onChange={(e) =>
                  updateTask(date, t.id, { status: e.target.value as TaskStatus })
                }
                className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-[10px] uppercase tracking-wider text-foreground/80 outline-none"
              >
                {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                  <option key={s} value={s} className="bg-black">
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm text-foreground ${t.status === "completed" ? "line-through opacity-60" : ""
                    } ${t.status === "cancelled" ? "line-through opacity-40" : ""}`}
                >
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                )}
                <div className="flex items-center gap-4 mt-2 text-[10px] uppercase tracking-wider">
                  <span className={PRIORITY[t.priority]}>● {t.priority}</span>
                  <span className="text-muted-foreground">
                    est {t.estimatedHours}h · actual {t.actualHours.toFixed(2)}h
                  </span>
                  <span className="text-foreground/70">
                    <LiveTimer task={t} />
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!t.timerRunning ? (
                  <button
                    onClick={() => startTimer(date, t.id)}
                    className="rounded-full p-2 hover:bg-white/5 text-foreground/80"
                    title="Start"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => pauseTimer(date, t.id)}
                    className="rounded-full p-2 hover:bg-white/5 text-foreground"
                    title="Pause"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => stopTimer(date, t.id)}
                  className="rounded-full p-2 hover:bg-white/5 text-muted-foreground"
                  title="Stop"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteTask(date, t.id)}
                  className="rounded-full p-2 hover:bg-white/5 text-muted-foreground"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}