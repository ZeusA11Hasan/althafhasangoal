import { motion } from "framer-motion";
import { useMission } from "@/lib/mission/store";

type Country = { code: string; name: string; region: string };

const COUNTRIES: Country[] = [
  { code: "IN", name: "India", region: "Asia" },
  { code: "JP", name: "Japan", region: "Asia" },
  { code: "SG", name: "Singapore", region: "Asia" },
  { code: "AE", name: "UAE", region: "Asia" },
  { code: "TH", name: "Thailand", region: "Asia" },
  { code: "ID", name: "Indonesia", region: "Asia" },
  { code: "KR", name: "South Korea", region: "Asia" },
  { code: "VN", name: "Vietnam", region: "Asia" },
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "IS", name: "Iceland", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "US", name: "United States", region: "North America" },
  { code: "CA", name: "Canada", region: "North America" },
  { code: "MX", name: "Mexico", region: "North America" },
  { code: "BR", name: "Brazil", region: "South America" },
  { code: "AR", name: "Argentina", region: "South America" },
  { code: "PE", name: "Peru", region: "South America" },
  { code: "CL", name: "Chile", region: "South America" },
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "MA", name: "Morocco", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
];

const REGIONS = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania"];

export function WorldTour() {
  const visitedCountries = useMission((s) => s.visitedCountries);
  const toggleCountry = useMission((s) => s.toggleCountry);
  const total = 195;
  const pct = (visitedCountries.length / total) * 100;

  return (
    <section className="relative w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              09 · World Tour
            </div>
            <h2 className="text-display text-4xl md:text-6xl text-foreground">
              {visitedCountries.length}{" "}
              <span className="text-muted-foreground">/ {total} countries.</span>
            </h2>
          </div>
          <div className="text-right">
            <div className="text-display text-3xl tabular-nums text-foreground">
              {pct.toFixed(1)}%
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Mission Completion
            </div>
          </div>
        </div>

        <div className="neu p-8">
          <div className="relative h-56 mb-10 flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, ease: "linear", repeat: Infinity }}
              className="absolute h-48 w-48 rounded-full border border-white/10"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.06), transparent 60%)",
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border border-white/[0.04]"
                  style={{ transform: `rotateY(${i * 20}deg)` }}
                />
              ))}
            </motion.div>
            <div className="absolute h-48 w-48 rounded-full ring-1 ring-white/10 shadow-[0_0_60px_rgba(255,255,255,0.08)]" />
            <div className="absolute text-center">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                Earth
              </div>
              <div className="text-display text-2xl text-foreground mt-1">
                {visitedCountries.length}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {REGIONS.map((region) => {
              const list = COUNTRIES.filter((c) => c.region === region);
              const visited = list.filter((c) => visitedCountries.includes(c.code)).length;
              return (
                <div key={region}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                      {region}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 tabular-nums">
                      {visited} / {list.length}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((c) => {
                      const on = visitedCountries.includes(c.code);
                      return (
                        <button
                          key={c.code}
                          onClick={() => toggleCountry(c.code)}
                          className={`px-3 py-1.5 rounded-full text-xs transition border ${on
                              ? "bg-white text-black border-white"
                              : "bg-transparent text-muted-foreground border-white/10 hover:border-white/30 hover:text-foreground"
                            }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}