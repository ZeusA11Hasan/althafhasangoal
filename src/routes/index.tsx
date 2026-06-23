import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Countdown } from "@/components/mission/Countdown";
import { DailyExecution } from "@/components/mission/DailyExecution";
import { Particles } from "@/components/mission/Particles";
import { Header } from "@/components/mission/Header";
import { SettingsPanel } from "@/components/mission/SettingsPanel";
import { SaveIndicator } from "@/components/mission/SaveIndicator";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { PremiumSectionLoader, KanbanLoader, ChartLoader } from "@/components/ui/premium-loaders";

// Above-fold components (Countdown, DailyExecution, Particles) are eagerly loaded.
// Everything below the fold is lazily loaded for faster initial paint.

const Timeline = lazy(() => import("@/components/mission/Timeline").then((m) => ({ default: m.Timeline })));
const Financial = lazy(() => import("@/components/mission/Financial").then((m) => ({ default: m.Financial })));
const PaceEngine = lazy(() => import("@/components/mission/PaceEngine").then((m) => ({ default: m.PaceEngine })));
const TaskHoursChart = lazy(() => import("@/components/mission/TaskHoursChart").then((m) => ({ default: m.TaskHoursChart })));
const Productivity = lazy(() => import("@/components/mission/Productivity").then((m) => ({ default: m.Productivity })));
const Heatmap = lazy(() => import("@/components/mission/Heatmap").then((m) => ({ default: m.Heatmap })));
const SalesChart = lazy(() => import("@/components/mission/SalesChart").then((m) => ({ default: m.SalesChart })));
const Calendar = lazy(() => import("@/components/mission/Calendar").then((m) => ({ default: m.Calendar })));
const Kanban = lazy(() => import("@/components/mission/EnhancedKanban").then((m) => ({ default: m.EnhancedKanban })));
const WorldTour = lazy(() => import("@/components/mission/WorldTour").then((m) => ({ default: m.WorldTour })));
const VisionBoard = lazy(() => import("@/components/mission/VisionBoard").then((m) => ({ default: m.VisionBoard })));
const AICoach = lazy(() => import("@/components/mission/AICoach").then((m) => ({ default: m.AICoach })));

function SectionSkeleton() {
  return null; // Premium loaders are imported directly into components
}

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  useKeyboardShortcuts({
    onCalendar: () => {
      // Scroll to calendar section
      document.querySelector("section")?.scrollIntoView({ behavior: "smooth" });
    },
  });

  return (
    <main className="relative bg-background text-foreground">
      <Particles />
      <Header />
      <div className="relative z-10">
        <Countdown />
        <DailyExecution />
        <Suspense fallback={<ChartLoader />}><TaskHoursChart /></Suspense>
        <Suspense fallback={<PremiumSectionLoader />}><Calendar /></Suspense>
        <Suspense fallback={<KanbanLoader />}><Kanban /></Suspense>
        <Suspense fallback={<PremiumSectionLoader />}><Timeline /></Suspense>
        <Suspense fallback={<ChartLoader />}><Productivity /></Suspense>
        <Suspense fallback={<ChartLoader />}><Heatmap /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><WorldTour /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><VisionBoard /></Suspense>
        <footer className="px-6 py-12 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground flex items-center justify-center gap-6">
          <span>Mission 2029 · Built for the obsessed</span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="underline underline-offset-4 hover:text-foreground transition"
          >
            Settings
          </button>
        </footer>
      </div>
      <SaveIndicator />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
