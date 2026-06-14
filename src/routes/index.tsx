import { createFileRoute } from "@tanstack/react-router";
import { Countdown } from "@/components/mission/Countdown";
import { Financial } from "@/components/mission/Financial";
import { SalesChart } from "@/components/mission/SalesChart";
import { Calendar } from "@/components/mission/Calendar";
import { Productivity } from "@/components/mission/Productivity";
import { Timeline } from "@/components/mission/Timeline";
import { TaskHoursChart } from "@/components/mission/TaskHoursChart";
import { Pomodoro } from "@/components/mission/Pomodoro";
import { Heatmap } from "@/components/mission/Heatmap";
import { PaceEngine } from "@/components/mission/PaceEngine";
import { WorldTour } from "@/components/mission/WorldTour";
import { DailyExecution } from "@/components/mission/DailyExecution";
import { VisionBoard } from "@/components/mission/VisionBoard";
import { WarMode } from "@/components/mission/WarMode";
import { AICoach } from "@/components/mission/AICoach";
import { Particles } from "@/components/mission/Particles";
import { Kanban } from "@/components/mission/Kanban";

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
    <main className="relative bg-background text-foreground">
      <Particles />
      <div className="relative z-10">
        <Countdown />
        <DailyExecution />
        <Pomodoro />
        <Timeline />
        <Financial />
        <PaceEngine />
        <TaskHoursChart />
        <Productivity />
        <Heatmap />
        <SalesChart />
        <Calendar />
        <Kanban />
        <WorldTour />
        <VisionBoard />
        <footer className="px-6 py-12 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Mission 2029 · Built for the obsessed
        </footer>
      </div>
      <WarMode />
      <AICoach />
    </main>
  );
}
