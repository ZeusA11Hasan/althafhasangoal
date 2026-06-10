import { createFileRoute } from "@tanstack/react-router";
import { Countdown } from "@/components/mission/Countdown";
import { Financial } from "@/components/mission/Financial";
import { SalesChart } from "@/components/mission/SalesChart";
import { Calendar } from "@/components/mission/Calendar";
import { Productivity } from "@/components/mission/Productivity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission 2029 — Founder OS" },
      {
        name: "description",
        content:
          "A cinematic operating system for founders. Countdown, financial pace, sales analytics, and a daily mission calendar.",
      },
      { property: "og:title", content: "Mission 2029 — Founder OS" },
      {
        property: "og:description",
        content:
          "₹1,00,000 in 30 days. ₹1 Crore in 1 year. Long-term freedom. A personal mission control.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-background text-foreground">
      <Countdown />
      <Financial />
      <SalesChart />
      <Calendar />
      <Productivity />
      <footer className="px-6 py-12 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        Mission 2029 · Built for the obsessed
      </footer>
    </main>
  );
}
