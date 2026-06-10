import { motion } from "framer-motion";
import { useMission } from "@/lib/mission/store";

export function VisionBoard() {
  const { visions } = useMission();
  return (
    <section className="relative w-full py-32 px-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(120,80,255,0.12),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(80,200,255,0.10),transparent_60%)] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
            12 · Vision
          </div>
          <h2 className="text-display text-5xl md:text-7xl text-foreground">
            What we're building <span className="text-muted-foreground">toward.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {visions.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="glass p-7 rounded-3xl aspect-[3/4] flex flex-col justify-between relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(135deg, hsl(${(i * 47) % 360},70%,60%) 0%, transparent 60%)`,
                  mixBlendMode: "overlay",
                }}
              />
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  {v.tag}
                </div>
              </div>
              <div className="relative">
                <div className="text-display text-3xl text-foreground leading-tight">
                  {v.title}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{v.subtitle}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}