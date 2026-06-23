import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, X, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMission, type DailyMissionItem } from "@/lib/mission/store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { EditForm } from "./DailyExecution";
import { COLORS, randomColor } from "@/lib/mission/constants";

type Status = NonNullable<DailyMissionItem["kanban"]>;

interface KanbanColumn {
  id: string;
  label: string;
  hint: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "backlog", label: "Backlog", hint: "Ideas & later" },
  { id: "today", label: "Today", hint: "Committed for today" },
  { id: "doing", label: "In Progress", hint: "Active focus" },
  { id: "done", label: "Done", hint: "Shipped" },
];

export function Kanban() {
  const selectedDate = useMission((s) => s.selectedDate);
  const days = useMission((s) => s.days);
  const defaultMissions = useMission((s) => s.dailyMission);
  const kanbanColumns = useMission((s) => s.kanbanColumns) || DEFAULT_COLUMNS;
  const setKanban = useMission((s) => s.setKanban);
  const addDailyMission = useMission((s) => s.addDailyMission);
  const updateKanbanColumns = useMission((s) => s.updateKanbanColumns);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editHint, setEditHint] = useState("");

  const day = days[selectedDate];
  const activeMissions = day?.dailyMission ?? defaultMissions;

  const byCol = (s: string) =>
    activeMissions.filter((d) => (d.kanban ?? "backlog") === s);

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column.id);
    setEditLabel(column.label);
    setEditHint(column.hint);
  };

  const saveColumnEdit = () => {
    if (editingColumn && updateKanbanColumns) {
      const updatedColumns = kanbanColumns.map(col =>
        col.id === editingColumn
          ? { ...col, label: editLabel, hint: editHint }
          : col
      );
      updateKanbanColumns(updatedColumns);
    }
    setEditingColumn(null);
  };

  const addColumn = () => {
    if (updateKanbanColumns) {
      const newId = `custom_${Date.now()}`;
      const newColumn: KanbanColumn = {
        id: newId,
        label: "New Board",
        hint: "Custom board"
      };
      updateKanbanColumns([...kanbanColumns, newColumn]);
    }
  };

  const addNewTask = () => {
    const firstColumn = kanbanColumns[0];
    addDailyMission(selectedDate, {
      label: "New Task",
      target: 1,
      unit: "task",
      description: "",
      priority: "medium",
      color: randomColor(),
      kanban: firstColumn.id as Status,
    });
  };

  const deleteColumn = (columnId: string) => {
    if (updateKanbanColumns && kanbanColumns.length > 1) {
      const updatedColumns = kanbanColumns.filter(col => col.id !== columnId);
      updateKanbanColumns(updatedColumns);
    }
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={addColumn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/30 transition px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> New Board
            </button>
            <button
              onClick={addNewTask}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/30 transition px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> New Task
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${kanbanColumns.length}, minmax(250px, 1fr))`,
          gap: '1rem'
        }}>
          {kanbanColumns.map((c) => {
            const items = byCol(c.id);
            const isOver = overCol === c.id;
            const isEditing = editingColumn === c.id;

            return (
              <div
                key={c.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(c.id);
                }}
                onDragLeave={() => setOverCol((v) => (v === c.id ? null : v))}
                onDrop={() => {
                  if (dragId) setKanban(selectedDate, dragId, c.id as Status);
                  setDragId(null);
                  setOverCol(null);
                }}
                className={`neu p-4 min-h-[280px] flex flex-col gap-3 transition ${isOver ? "ring-1 ring-white/30 bg-white/[0.03]" : ""
                  }`}
              >
                <div className="flex items-baseline justify-between mb-1 group">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full bg-transparent text-sm text-foreground border-b border-white/20 focus:border-white/40 outline-none px-0 py-1"
                          placeholder="Board name"
                        />
                        <input
                          value={editHint}
                          onChange={(e) => setEditHint(e.target.value)}
                          className="w-full bg-transparent text-[10px] text-muted-foreground border-b border-white/10 focus:border-white/20 outline-none px-0 py-0.5"
                          placeholder="Board description"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={saveColumnEdit}
                            className="text-[9px] px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingColumn(null)}
                            className="text-[9px] px-2 py-1 bg-gray-600/20 text-gray-400 rounded hover:bg-gray-600/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div
                            className="text-sm text-foreground tracking-wide cursor-pointer hover:text-white/80 transition"
                            onClick={() => handleEditColumn(c)}
                          >
                            {c.label}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditColumn(c)}
                              className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            {kanbanColumns.length > 1 && (
                              <button
                                onClick={() => deleteColumn(c.id)}
                                className="p-1 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-400 transition"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">
                          {c.hint}
                        </div>
                      </>
                    )}
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
                      date={selectedDate}
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
  date,
  onDragStart,
  onDragEnd,
}: {
  item: DailyMissionItem;
  date: string;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const updateDailyMission = useMission((s) => s.updateDailyMission);
  const deleteDailyMission = useMission((s) => s.deleteDailyMission);
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
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground leading-tight">{item.label}</div>
          {item.description && (
            <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {item.description}
            </div>
          )}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all">
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 border-white/20 bg-black/90 backdrop-blur-xl">
            <EditForm
              item={item}
              onChange={(updates) => {
                updateDailyMission(date, item.id, updates);
                setOpen(false);
              }}
              onDelete={() => {
                deleteDailyMission(date, item.id);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <div
            className={`text-[9px] px-2 py-0.5 rounded-full ${item.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
              item.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
              }`}
          >
            {item.priority?.toUpperCase()}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {item.target} {item.unit}
        </div>
      </div>
    </motion.div>
  );
}