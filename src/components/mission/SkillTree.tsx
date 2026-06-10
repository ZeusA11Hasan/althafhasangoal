import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useMission } from "@/lib/mission/store";

export function SkillTree() {
  const { skills, addSkillXP } = useMission();

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
            10 · Skill Tree
          </div>
          <h2 className="text-display text-4xl md:text-6xl text-foreground">
            Level up. <span className="text-muted-foreground">Every day.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((s, i) => {
            const level = Math.floor(s.xp / s.xpPerLevel) + 1;
            const inLevel = s.xp % s.xpPerLevel;
            const pct = (inLevel / s.xpPerLevel) * 100;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="neu p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                      {s.name}
                    </div>
                    <div className="text-display text-3xl text-foreground mt-2">
                      Lv {level}
                    </div>
                  </div>
                  <button
                    onClick={() => addSkillXP(s.id, 50)}
                    className="neu-inset p-2 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                    title="+50 XP"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-5">
                  <div className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/40 to-white"
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground tabular-nums">
                    <span>{inLevel} XP</span>
                    <span>/ {s.xpPerLevel} XP</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}