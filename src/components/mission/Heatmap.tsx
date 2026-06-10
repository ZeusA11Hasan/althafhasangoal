import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { useMission, type DayEntry } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";

type Track = "productive" | "workout" | "learning" | "revenue";

function score(d: DayEntry | undefined, track: Track) {
  if (!d) return 0;
  switch (track) {
    case "productive":
      return Math.min(1, d.hoursWorked / 9);
    case "workout":
      return d.workoutDone ? 1 : 0;
    case "learning": {
      const hrs = d.learningHours ?? (d.readingMinutes ?? 0) / 60;
      return Math.min(1, hrs / 2);
    }
    case "revenue":
      return Math.min(1, d.revenueGenerated / 5000);
  }
}

function bg(lvl: number) {
  if (lvl <= 0) return "rgba(255,255,255,0.03)";
  return `rgba(255,255,255,${0.15 + lvl * 0.75})`;
}

export function Heatmap() {
  const { days } = useMission();
  const [track, setTrack] = useState<Track>("productive");
  const [hover, setHover] = useState<string | null>(null);

  const cells = useMemo(() => {
    const out: { key: string }[] = [];
    const end = new Date();
    const start = subDays(end, 7 * 18 - 1);
    let d = start;
    while (d <= end) {
      out.push({ key: format(d, "yyyy-MM-dd") });
      d = addDays(d, 1);
    }
    return out;
  }, []);

  const hoveredDay = hover ? days[hover] : null;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              07 · Mission Heatmap
            </div>
            <h2 className="text-display text-4xl md:text-6xl text-foreground">
              Every day, <span className="text-muted-foreground">tracked.</span>
            </h2>
          </div>
          <div className="flex gap-1.5 neu p-1 rounded-full">
            {(["productive", "workout", "learning", "revenue"] as Track[]).map((t) => (
              <button
                key={t}
                onClick={() => setTrack(t)}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] rounded-full transition ${
                  track === t
                    ? "bg-white text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="neu p-6">
          <div className="overflow-x-auto">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateRows: "repeat(7, minmax(0,1fr))",
                gridAutoFlow: "column",
              }}
            >
              {cells.map(({ key }) => {
                const lvl = score(days[key], track);
                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.4 }}
                    onMouseEnter={() => setHover(key)}
                    onMouseLeave={() => setHover(null)}
                    className="h-3.5 w-3.5 rounded-[3px] cursor-pointer transition"
                    style={{ background: bg(lvl) }}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <div>
              {hover ? (
                <span className="text-foreground tabular-nums">
                  {format(parseISO(hover), "MMM d, yyyy")}{" "}
                  <span className="text-muted-foreground">·</span>{" "}
                  {hoveredDay?.hoursWorked ?? 0}h ·{" "}
                  {hoveredDay?.tasksCompleted ?? 0} tasks ·{" "}
                  {fmtINR(hoveredDay?.revenueGenerated ?? 0)}
                </span>
              ) : (
                <span>Hover any day for stats</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Less</span>
              {[0, 0.2, 0.45, 0.7, 1].map((l, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-sm"
                  style={{ background: bg(l) }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}