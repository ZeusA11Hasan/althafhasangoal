import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Brain, X } from "lucide-react";
import { useMission, todayKey } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";

export function AICoach() {
  const [open, setOpen] = useState(false);
  const days = useMission((s) => s.days);
  const dailyMission = useMission((s) => s.dailyMission);
  const revenueTarget = useMission((s) => s.revenueTarget);
  const currentRevenue = useMission((s) => s.currentRevenue);
  const today = days[todayKey()];

  const messages = useMemo(() => {
    const out: { kind: "warn" | "ok" | "info"; text: string }[] = [];
    const outreach = today?.outreachSent ?? today?.coldCalls ?? 0;
    const target = dailyMission.find((d) => d.id === "d1")?.target ?? 20;
    if (outreach < target) {
      const gap = target - outreach;
      const pctBehind = Math.round((gap / target) * 100);
      out.push({
        kind: "warn",
        text: `You are ${pctBehind}% behind outreach target today. Send ${gap} more messages.`,
      });
    } else {
      out.push({ kind: "ok", text: `Outreach target hit (${outreach}). Keep momentum.` });
    }

    const hours = today?.hoursWorked ?? 0;
    if (hours < 4)
      out.push({
        kind: "warn",
        text: `Only ${hours.toFixed(1)}h of work logged. Block 2 deep work hours now.`,
      });

    if (!today?.workoutDone)
      out.push({ kind: "info", text: "Workout not logged. Body fuels mission." });

    const remaining = Math.max(0, revenueTarget - currentRevenue);
    out.push({
      kind: "info",
      text: `${fmtINR(remaining)} remaining to hit your 30-day sprint goal.`,
    });

    const done = dailyMission.filter((d) => d.done).length;
    out.push({
      kind: done === dailyMission.length ? "ok" : "info",
      text: `Daily mission: ${done}/${dailyMission.length} complete.`,
    });
    return out;
  }, [today, dailyMission, revenueTarget, currentRevenue]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.25)]"
      >
        <Brain className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[92vw] glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Coach · Live
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/5 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 text-sm"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full ${msg.kind === "warn"
                        ? "bg-warning"
                        : msg.kind === "ok"
                          ? "bg-success"
                          : "bg-white/60"
                      }`}
                  />
                  <span className="text-foreground/85 leading-snug">{msg.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}