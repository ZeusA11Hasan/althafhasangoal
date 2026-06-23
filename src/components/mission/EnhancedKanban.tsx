import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Edit2, Trash2, Calendar, Clock, Tag, User,
    Play, Pause, MessageSquare, Paperclip,
    ChevronDown, Filter, Search, MoreHorizontal,
    CheckCircle2, Circle, Target, Timer, AlertCircle,
    Zap, Copy, Archive, Star, X
} from "lucide-react";
import { useState, useMemo } from "react";
import { useMission, type DailyMissionItem, type SubTask, type TaskComment } from "@/lib/mission/store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { COLORS, randomColor } from "@/lib/mission/constants";
import { format, parseISO, isToday, isPast, isFuture } from "date-fns";

type Status = NonNullable<DailyMissionItem["kanban"]>;

interface KanbanColumn {
    id: string;
    label: string;
    hint: string;
    color?: string;
    limit?: number;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
    { id: "backlog", label: "Backlog", hint: "Ideas & later", color: "#6b7280" },
    { id: "today", label: "Today", hint: "Committed for today", color: "#3b82f6" },
    { id: "doing", label: "In Progress", hint: "Active focus", color: "#f59e0b" },
    { id: "done", label: "Done", hint: "Shipped", color: "#10b981" },
];

const PRIORITIES = [
    { value: "low", label: "Low", color: "#10b981", icon: "↓" },
    { value: "medium", label: "Medium", color: "#f59e0b", icon: "→" },
    { value: "high", label: "High", color: "#ef4444", icon: "↑" },
    { value: "critical", label: "Critical", color: "#dc2626", icon: "⚡" },
];

export function EnhancedKanban() {
    const selectedDate = useMission((s) => s.selectedDate);
    const days = useMission((s) => s.days);
    const defaultMissions = useMission((s) => s.dailyMission);
    const kanbanColumns = useMission((s) => s.kanbanColumns) || DEFAULT_COLUMNS;
    const setKanban = useMission((s) => s.setKanban);
    const addDailyMission = useMission((s) => s.addDailyMission);
    const updateKanbanColumns = useMission((s) => s.updateKanbanColumns);
    const updateDailyMission = useMission((s) => s.updateDailyMission);
    const deleteDailyMission = useMission((s) => s.deleteDailyMission);

    const [dragId, setDragId] = useState<string | null>(null);
    const [overCol, setOverCol] = useState<string | null>(null);
    const [editingColumn, setEditingColumn] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPriority, setFilterPriority] = useState<string | null>(null);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCard, setSelectedCard] = useState<DailyMissionItem | null>(null);
    const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);

    const day = days[selectedDate];
    const activeMissions = day?.dailyMission ?? defaultMissions;

    // Get all unique tags for filtering
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        activeMissions.forEach(mission => {
            if (mission.tags) {
                mission.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags);
    }, [activeMissions]);

    // Filter and search tasks
    const filteredMissions = useMemo(() => {
        return activeMissions.filter(mission => {
            // Search filter
            if (searchQuery && !mission.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !mission.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Priority filter
            if (filterPriority && mission.priority !== filterPriority) {
                return false;
            }

            // Tags filter
            if (filterTags.length > 0) {
                if (!mission.tags || !filterTags.some(tag => mission.tags!.includes(tag))) {
                    return false;
                }
            }

            return true;
        });
    }, [activeMissions, searchQuery, filterPriority, filterTags]);

    const byCol = (s: string) =>
        filteredMissions.filter((d) => (d.kanban ?? "backlog") === s);

    const addNewTask = (columnId?: string) => {
        const targetColumn = columnId || kanbanColumns[0]?.id || "backlog";
        const newTask = {
            label: "New Task",
            target: 1,
            unit: "task",
            description: "",
            priority: "medium" as const,
            color: randomColor(),
            kanban: targetColumn as Status,
            createdAt: new Date().toISOString(),
            tags: [],
            subTasks: [],
            comments: [],
            attachments: [],
            progress: 0,
        };

        addDailyMission(selectedDate, newTask);
        setNewTaskColumn(null);
    };

    const duplicateTask = (task: DailyMissionItem) => {
        const duplicated = {
            ...task,
            label: `${task.label} (Copy)`,
            done: false,
            progress: 0,
            createdAt: new Date().toISOString(),
            id: undefined, // Will be auto-generated
        };
        addDailyMission(selectedDate, duplicated);
    };

    const addColumn = () => {
        if (updateKanbanColumns) {
            const newId = `custom_${Date.now()}`;
            const newColumn: KanbanColumn = {
                id: newId,
                label: "New Board",
                hint: "Custom board",
                color: randomColor(),
            };
            updateKanbanColumns([...kanbanColumns, newColumn]);
        }
    };

    const deleteColumn = (columnId: string) => {
        if (updateKanbanColumns && kanbanColumns.length > 1) {
            const updatedColumns = kanbanColumns.filter(col => col.id !== columnId);
            updateKanbanColumns(updatedColumns);

            // Move tasks from deleted column to first column
            const tasksInColumn = byCol(columnId);
            tasksInColumn.forEach(task => {
                setKanban(selectedDate, task.id, updatedColumns[0]?.id as Status);
            });
        }
    };

    const getTaskStats = (columnId: string) => {
        const tasks = byCol(columnId);
        const completed = tasks.filter(t => t.done).length;
        const total = tasks.length;
        const overdue = tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && !t.done).length;
        return { completed, total, overdue };
    };

    return (
        <section className="relative w-full py-24 px-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
                            11 · Enhanced Kanban Board
                        </div>
                        <h2 className="text-display text-4xl md:text-6xl text-foreground">
                            Move work. <span className="text-muted-foreground">Ship outcomes.</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 rounded-full border transition px-4 py-2 text-xs uppercase tracking-[0.25em] ${showFilters ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-white/10 hover:border-white/30 text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Filter className="h-3.5 w-3.5" /> Filters
                        </button>
                        <button
                            onClick={addColumn}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/30 transition px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-3.5 w-3.5" /> Board
                        </button>
                        <button
                            onClick={() => addNewTask()}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 border border-blue-500 transition px-4 py-2 text-xs uppercase tracking-[0.25em] text-white"
                        >
                            <Plus className="h-3.5 w-3.5" /> Task
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-64">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:border-white/30 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <select
                                value={filterPriority || ""}
                                onChange={(e) => setFilterPriority(e.target.value || null)}
                                className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-foreground focus:border-white/30 focus:outline-none"
                            >
                                <option value="">All Priorities</option>
                                {PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>

                            {allTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                if (filterTags.includes(tag)) {
                                                    setFilterTags(filterTags.filter(t => t !== tag));
                                                } else {
                                                    setFilterTags([...filterTags, tag]);
                                                }
                                            }}
                                            className={`px-2 py-1 rounded-full text-xs border transition ${filterTags.includes(tag)
                                                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30"
                                                }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {(searchQuery || filterPriority || filterTags.length > 0) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterPriority(null);
                                        setFilterTags([]);
                                    }}
                                    className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Kanban Board */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${kanbanColumns.length}, minmax(300px, 1fr))`,
                    gap: '1.5rem'
                }}>
                    {kanbanColumns.map((column) => {
                        const tasks = byCol(column.id);
                        const isOver = overCol === column.id;
                        const stats = getTaskStats(column.id);

                        return (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                tasks={tasks}
                                stats={stats}
                                isOver={isOver}
                                selectedDate={selectedDate}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setOverCol(column.id);
                                }}
                                onDragLeave={() => setOverCol((v) => (v === column.id ? null : v))}
                                onDrop={() => {
                                    if (dragId) setKanban(selectedDate, dragId, column.id as Status);
                                    setDragId(null);
                                    setOverCol(null);
                                }}
                                onAddTask={() => addNewTask(column.id)}
                                onDeleteColumn={() => deleteColumn(column.id)}
                                canDelete={kanbanColumns.length > 1}
                                setDragId={setDragId}
                                setSelectedCard={setSelectedCard}
                                duplicateTask={duplicateTask}
                            />
                        );
                    })}
                </div>

                {/* Task Detail Modal */}
                {selectedCard && (
                    <TaskDetailModal
                        task={selectedCard}
                        selectedDate={selectedDate}
                        onClose={() => setSelectedCard(null)}
                        onUpdate={updateDailyMission}
                        onDelete={deleteDailyMission}
                    />
                )}
            </div>
        </section>
    );
}

// Kanban Column Component
function KanbanColumn({
    column,
    tasks,
    stats,
    isOver,
    selectedDate,
    onDragOver,
    onDragLeave,
    onDrop,
    onAddTask,
    onDeleteColumn,
    canDelete,
    setDragId,
    setSelectedCard,
    duplicateTask,
}: {
    column: KanbanColumn;
    tasks: DailyMissionItem[];
    stats: { completed: number; total: number; overdue: number };
    isOver: boolean;
    selectedDate: string;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: () => void;
    onAddTask: () => void;
    onDeleteColumn: () => void;
    canDelete: boolean;
    setDragId: (id: string | null) => void;
    setSelectedCard: (task: DailyMissionItem | null) => void;
    duplicateTask: (task: DailyMissionItem) => void;
}) {
    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`neu p-4 min-h-[400px] flex flex-col gap-3 transition ${isOver ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
                }`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color || "#6b7280" }}
                    />
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
                        <p className="text-xs text-muted-foreground">{column.hint}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                        {stats.completed}/{stats.total}
                        {stats.overdue > 0 && (
                            <span className="ml-1 text-red-400">({stats.overdue} overdue)</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onAddTask}
                            className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                        {canDelete && (
                            <button
                                onClick={onDeleteColumn}
                                className="p-1 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-400 transition"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {stats.total > 0 && (
                <div className="w-full bg-white/10 rounded-full h-1 mb-2">
                    <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                            width: `${(stats.completed / stats.total) * 100}%`,
                            backgroundColor: column.color || "#6b7280"
                        }}
                    />
                </div>
            )}

            {/* Tasks */}
            <AnimatePresence initial={false}>
                {tasks.map((task) => (
                    <EnhancedTaskCard
                        key={task.id}
                        task={task}
                        selectedDate={selectedDate}
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setSelectedCard(task)}
                        onDuplicate={() => duplicateTask(task)}
                    />
                ))}
            </AnimatePresence>

            {tasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground/60">
                        <div className="text-sm mb-2">No tasks</div>
                        <button
                            onClick={onAddTask}
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                        >
                            + Add first task
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Enhanced Task Card Component
function EnhancedTaskCard({
    task,
    selectedDate,
    onDragStart,
    onDragEnd,
    onClick,
    onDuplicate,
}: {
    task: DailyMissionItem;
    selectedDate: string;
    onDragStart: () => void;
    onDragEnd: () => void;
    onClick: () => void;
    onDuplicate: () => void;
}) {
    const updateDailyMission = useMission((s) => s.updateDailyMission);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const priority = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
    const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !task.done;
    const completedSubTasks = task.subTasks?.filter(st => st.done).length || 0;
    const totalSubTasks = task.subTasks?.length || 0;

    const toggleTimer = () => {
        const now = Date.now();
        if (isTimerRunning) {
            // Stop timer
            const elapsed = now - (task.timerStarted || now);
            const newAccumulated = (task.timerAccumulated || 0) + elapsed;
            updateDailyMission(selectedDate, task.id, {
                timerStarted: undefined,
                timerAccumulated: newAccumulated,
                actualHours: newAccumulated / (1000 * 60 * 60)
            });
            setIsTimerRunning(false);
        } else {
            // Start timer
            updateDailyMission(selectedDate, task.id, {
                timerStarted: now
            });
            setIsTimerRunning(true);
        }
    };

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
            onClick={onClick}
            className={`group relative rounded-xl bg-black/40 border border-white/[0.06] p-4 cursor-pointer hover:border-white/20 transition ${task.done ? "opacity-70" : ""
                } ${isOverdue ? "border-red-500/30" : ""}`}
            style={{ borderLeftColor: task.color || priority.color, borderLeftWidth: 3 }}
        >
            {/* Task Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                updateDailyMission(selectedDate, task.id, { done: !task.done });
                            }}
                            className="text-muted-foreground hover:text-foreground transition"
                        >
                            {task.done ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <Circle className="h-4 w-4" />
                            )}
                        </button>
                        <h4 className={`text-sm font-medium text-foreground leading-tight ${task.done ? "line-through" : ""
                            }`}>
                            {task.label}
                        </h4>
                    </div>

                    {task.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {task.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: priority.color }}
                        title={priority.label}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                            >
                                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-black/90 border-white/20" align="end">
                            <div className="space-y-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate();
                                    }}
                                    className="flex items-center gap-2 w-full px-2 py-1 text-xs hover:bg-white/10 rounded"
                                >
                                    <Copy className="h-3 w-3" /> Duplicate
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTimer();
                                    }}
                                    className="flex items-center gap-2 w-full px-2 py-1 text-xs hover:bg-white/10 rounded"
                                >
                                    {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                    {isTimerRunning ? "Pause Timer" : "Start Timer"}
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Progress Bar */}
            {task.progress !== undefined && task.progress > 0 && (
                <div className="w-full bg-white/10 rounded-full h-1 mb-3">
                    <div
                        className="h-1 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
            )}

            {/* Subtasks */}
            {totalSubTasks > 0 && (
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{completedSubTasks}/{totalSubTasks} subtasks</span>
                </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-muted-foreground"
                        >
                            #{tag}
                        </span>
                    ))}
                    {task.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                            +{task.tags.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : isToday(parseISO(task.dueDate)) ? "text-yellow-400" : ""
                            }`}>
                            <Calendar className="h-3 w-3" />
                            <span>{format(parseISO(task.dueDate), "MMM d")}</span>
                        </div>
                    )}

                    {task.estimatedHours && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimatedHours}h</span>
                        </div>
                    )}

                    {task.assignee && (
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignee}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {task.comments && task.comments.length > 0 && (
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task.comments.length}</span>
                        </div>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{task.attachments.length}</span>
                        </div>
                    )}

                    {isTimerRunning && (
                        <Timer className="h-3 w-3 text-green-400 animate-pulse" />
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Task Detail Modal Component
function TaskDetailModal({
    task,
    selectedDate,
    onClose,
    onUpdate,
    onDelete,
}: {
    task: DailyMissionItem;
    selectedDate: string;
    onClose: () => void;
    onUpdate: (date: string, id: string, patch: Partial<DailyMissionItem>) => void;
    onDelete: (date: string, id: string) => void;
}) {
    const [formData, setFormData] = useState({
        label: task.label || "",
        description: task.description || "",
        priority: task.priority || "medium",
        dueDate: task.dueDate || "",
        assignee: task.assignee || "",
        estimatedHours: task.estimatedHours || 0,
        progress: task.progress || 0,
        tags: task.tags?.join(", ") || "",
    });

    const [newSubTask, setNewSubTask] = useState("");
    const [activeTab, setActiveTab] = useState("details");

    const handleSave = () => {
        const updates: Partial<DailyMissionItem> = {
            ...formData,
            tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : [],
            updatedAt: new Date().toISOString(),
        };
        onUpdate(selectedDate, task.id, updates);
        onClose();
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this task?")) {
            onDelete(selectedDate, task.id);
            onClose();
        }
    };

    const addSubTask = () => {
        if (!newSubTask.trim()) return;

        const newSubTasks = [...(task.subTasks || []), {
            id: Date.now().toString(),
            label: newSubTask.trim(),
            done: false,
        }];

        onUpdate(selectedDate, task.id, { subTasks: newSubTasks });
        setNewSubTask("");
    };

    const toggleSubTask = (subTaskId: string) => {
        const updatedSubTasks = task.subTasks?.map(st =>
            st.id === subTaskId ? { ...st, done: !st.done } : st
        );
        onUpdate(selectedDate, task.id, { subTasks: updatedSubTasks });
    };

    const deleteSubTask = (subTaskId: string) => {
        const updatedSubTasks = task.subTasks?.filter(st => st.id !== subTaskId);
        onUpdate(selectedDate, task.id, { subTasks: updatedSubTasks });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border border-white/20 rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: task.color || "#6b7280" }}
                        />
                        <input
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            className="text-xl font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0"
                            placeholder="Task name"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                            title="Delete Task"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-white/10">
                    {[
                        { id: "details", label: "Details" },
                        { id: "subtasks", label: `Subtasks (${task.subTasks?.length || 0})` },
                        { id: "comments", label: `Comments (${task.comments?.length || 0})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Details Tab */}
                    {activeTab === "details" && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none"
                                    >
                                        {PRIORITIES.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Assignee
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.assignee}
                                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none"
                                        placeholder="Assign to..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Estimated Hours
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={formData.estimatedHours}
                                        onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Progress: {formData.progress}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none"
                                    placeholder="urgent, feature, bug"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none resize-none"
                                    placeholder="Add a description..."
                                />
                            </div>

                            {/* Time Tracking */}
                            {task.actualHours && (
                                <div className="p-4 bg-white/5 rounded-lg">
                                    <h4 className="text-sm font-medium text-foreground mb-2">Time Tracking</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Estimated:</span>
                                            <span className="ml-2 text-foreground">{formData.estimatedHours}h</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Actual:</span>
                                            <span className="ml-2 text-foreground">{task.actualHours?.toFixed(1)}h</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Subtasks Tab */}
                    {activeTab === "subtasks" && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubTask}
                                    onChange={(e) => setNewSubTask(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && addSubTask()}
                                    className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-foreground focus:border-blue-500 focus:outline-none"
                                    placeholder="Add a subtask..."
                                />
                                <button
                                    onClick={addSubTask}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="space-y-2">
                                {task.subTasks?.map((subTask) => (
                                    <div key={subTask.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg group">
                                        <button
                                            onClick={() => toggleSubTask(subTask.id)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {subTask.done ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Circle className="h-4 w-4" />
                                            )}
                                        </button>
                                        <span className={`flex-1 text-sm ${subTask.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                            {subTask.label}
                                        </span>
                                        <button
                                            onClick={() => deleteSubTask(subTask.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                {(!task.subTasks || task.subTasks.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No subtasks yet. Add one above.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Comments Tab */}
                    {activeTab === "comments" && (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Comments feature coming soon!</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}