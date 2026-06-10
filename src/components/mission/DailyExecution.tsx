import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useMission } from "@/lib/mission/store";

export function DailyExecution() {
  const { dailyMission, toggleDailyMission } = useMission();
  const doneCount = dailyMission.filter((d) => d.done).length;
  const pct = (doneCount / dailyMission.length) * 100;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              11 · Today's Mission
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
            {dailyMission.map((d) => (
              <motion.button
                key={d.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleDailyMission(d.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition text-left ${
                  d.done
                    ? "bg-white/[0.05] border-white/15"
                    : "neu-inset border-transparent hover:bg-white/[0.02]"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${
                    d.done
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div
                    className={`text-base ${
                      d.done ? "text-foreground/60 line-through" : "text-foreground"
                    }`}
                  >
                    {d.label}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                    Target · {d.target} {d.unit}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}