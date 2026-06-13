import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useMission, type Milestone } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";
import { Modal, Field } from "./Modal";

export function Timeline() {
  const { milestones, missionStart, missionTarget, upsertMilestone, removeMilestone } =
    useMission();
  const [editing, setEditing] = useState<Milestone | null>(null);

  const start = new Date(missionStart).getTime();
  const end = new Date(missionTarget).getTime();
  const now = Date.now();
  const nowPct = Math.max(0, Math.min(1, (now - start) / (end - start)));

  const ordered = useMemo(
    () =>
      [...milestones].sort(
        (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      ),
    [milestones],
  );

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              01.5 · Mission Trajectory
            </div>
            <h2 className="text-display text-xl md:text-2xl text-foreground tracking-tight">
              The arc <span className="text-muted-foreground">·</span> trajectory
            </h2>
          </div>
          <button
            onClick={() =>
              setEditing({
                id: crypto.randomUUID(),
                label: "New Milestone",
                targetRevenue: 0,
                targetDate: new Date().toISOString().slice(0, 10),
                done: false,
              })
            }
            className="neu px-4 py-2.5 text-xs uppercase tracking-[0.3em] text-foreground/80 hover:text-foreground inline-flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" /> Milestone
          </button>
        </div>

        <div className="neu p-8">
          <div className="relative h-1 w-full rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${nowPct * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/60 to-white"
            />
            <div
              className="absolute -top-1.5 h-4 w-4 -translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.7)]"
              style={{ left: `${nowPct * 100}%` }}
            />
            {ordered.map((m) => {
              const ts = new Date(m.targetDate).getTime();
              const p = Math.max(0, Math.min(1, (ts - start) / (end - start)));
              return (
                <button
                  key={m.id}
                  onClick={() => setEditing(m)}
                  className="absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full border border-white/40 bg-background hover:bg-white transition"
                  style={{ left: `${p * 100}%` }}
                  title={m.label}
                />
              );
            })}
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>{format(parseISO(missionStart), "MMM yyyy")}</span>
            <span className="text-foreground">Now</span>
            <span>{format(parseISO(missionTarget), "MMM yyyy")}</span>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {ordered.map((m, i) => {
              const days = differenceInDays(new Date(m.targetDate), new Date());
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="neu-inset p-5 group cursor-pointer"
                  onClick={() => setEditing(m)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {format(parseISO(m.targetDate), "MMM yyyy")}
                    </div>
                    <div
                      className={`text-[9px] uppercase tracking-[0.3em] ${
                        m.done
                          ? "text-success"
                          : days < 0
                            ? "text-danger"
                            : "text-muted-foreground"
                      }`}
                    >
                      {m.done ? "● Done" : days < 0 ? "● Missed" : `T-${days}d`}
                    </div>
                  </div>
                  <div className="text-display text-2xl text-foreground mt-3">{m.label}</div>
                  <div className="text-sm text-muted-foreground mt-1 tabular-nums">
                    {fmtINR(m.targetRevenue)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMilestone(m.id);
                    }}
                    className="mt-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-danger opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Milestone">
        {editing && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Label"
                value={editing.label}
                onChange={(v) => setEditing({ ...editing, label: String(v) })}
              />
              <Field
                label="Target Date"
                type="date"
                value={editing.targetDate.slice(0, 10)}
                onChange={(v) => setEditing({ ...editing, targetDate: String(v) })}
              />
              <Field
                label="Target Revenue"
                type="number"
                prefix="₹"
                value={editing.targetRevenue}
                onChange={(v) => setEditing({ ...editing, targetRevenue: +v })}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-3 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={editing.done}
                    onChange={(e) => setEditing({ ...editing, done: e.target.checked })}
                    className="h-4 w-4 accent-white"
                  />
                  Mark complete
                </label>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => {
                  upsertMilestone(editing);
                  setEditing(null);
                }}
                className="rounded-full bg-white text-black px-6 py-2.5 text-sm font-medium hover:bg-white/90 transition"
              >
                Save
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}