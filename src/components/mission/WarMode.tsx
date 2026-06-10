import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Swords, X } from "lucide-react";
import { useMission } from "@/lib/mission/store";

const QUOTES = [
  "Every second is either building your future or destroying it.",
  "The market doesn't care about your feelings. Execute.",
  "Discipline equals freedom.",
  "You will become what you do today.",
  "Pain is the price of admission to a great life.",
  "Outwork everyone. Out-think everyone. Out-care everyone.",
];

export function WarMode() {
  const [open, setOpen] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const { dailyMission, toggleDailyMission, missionTarget } = useMission();

  useEffect(() => {
    if (!open) return;
    const q = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 7000);
    return () => clearInterval(q);
  }, [open]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const days = Math.max(
    0,
    Math.floor((new Date(missionTarget).getTime() - Date.now()) / 86400000),
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 neu px-5 py-3 rounded-full flex items-center gap-3 hover:bg-white/5 transition"
      >
        <Swords className="h-4 w-4 text-foreground" />
        <span className="text-[11px] uppercase tracking-[0.4em] text-foreground">
          Enter War Mode
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black overflow-y-auto"
          >
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
              <div className="absolute inset-10 border border-white/5 rounded-3xl" />
            </div>

            <button
              onClick={() => setOpen(false)}
              className="absolute top-6 right-6 rounded-full p-3 hover:bg-white/5 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-8 py-16 text-center">
              <div className="text-[10px] uppercase tracking-[0.6em] text-danger mb-4 animate-pulse">
                ● War Mode Engaged
              </div>
              <div className="text-display text-[18vw] md:text-[12rem] leading-none text-foreground tabular-nums">
                {days.toLocaleString()}
              </div>
              <div className="text-[11px] uppercase tracking-[0.5em] text-muted-foreground mt-2">
                Days to 2029
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
                <div className="text-display text-6xl text-foreground tabular-nums">
                  {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                  {String(seconds % 60).padStart(2, "0")}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRunning((r) => !r)}
                    className="rounded-full bg-white text-black px-5 py-2 text-xs uppercase tracking-[0.3em]"
                  >
                    {running ? "Pause" : "Start"}
                  </button>
                  <button
                    onClick={() => {
                      setRunning(false);
                      setSeconds(25 * 60);
                    }}
                    className="rounded-full border border-white/15 px-5 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-10 w-full max-w-xl">
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-4">
                  Today's Mission
                </div>
                <div className="space-y-2">
                  {dailyMission.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => toggleDailyMission(d.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                        d.done
                          ? "bg-white/[0.06] border-white/15 text-foreground/60 line-through"
                          : "border-white/10 text-foreground hover:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          d.done ? "bg-white border-white" : "border-white/30"
                        }`}
                      />
                      <span className="flex-1">{d.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {d.target} {d.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <motion.div
                key={quoteIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-12 max-w-2xl text-sm md:text-base italic text-muted-foreground"
              >
                "{QUOTES[quoteIdx]}"
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}