import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Header } from "@/components/mission/Header";
import { SaveIndicator } from "@/components/mission/SaveIndicator";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { PremiumSectionLoader, ChartLoader, KanbanLoader } from "@/components/ui/premium-loaders";

// Lazy load components for revenue page
const SalesChart = lazy(() => import("@/components/mission/SalesChart").then((m) => ({ default: m.SalesChart })));
const Financial = lazy(() => import("@/components/mission/Financial").then((m) => ({ default: m.Financial })));
const PaceEngine = lazy(() => import("@/components/mission/PaceEngine").then((m) => ({ default: m.PaceEngine })));
const Kanban = lazy(() => import("@/components/mission/EnhancedKanban").then((m) => ({ default: m.EnhancedKanban })));

export const Route = createFileRoute("/revenue")({
    head: () => ({
        meta: [
            { title: "Revenue Dashboard — Mission 2029" },
            {
                name: "description",
                content:
                    "Revenue tracking, cold calls analytics, and sales performance dashboard for Mission 2029.",
            },
            { property: "og:title", content: "Revenue Dashboard — Mission 2029" },
            {
                property: "og:description",
                content:
                    "Track your revenue goals, cold calls, follow-ups, and deals closed. Sales performance analytics.",
            },
        ],
    }),
    component: RevenuePage,
});

function RevenuePage() {
    useKeyboardShortcuts({
        onCalendar: () => {
            // Scroll to first section
            document.querySelector("section")?.scrollIntoView({ behavior: "smooth" });
        },
    });

    return (
        <main className="relative bg-background text-foreground">
            <Header />

            <div className="relative z-10">
                {/* PaceEngine Section - Shows large revenue display */}
                <Suspense fallback={<ChartLoader />}>
                    <PaceEngine />
                </Suspense>

                {/* Financial Section - Moved from home page */}
                <Suspense fallback={<PremiumSectionLoader />}>
                    <Financial />
                </Suspense>

                {/* Sales Chart Section - Moved from home page */}
                <Suspense fallback={<ChartLoader />}>
                    <SalesChart />
                </Suspense>

                {/* Kanban Board */}
                <Suspense fallback={<KanbanLoader />}>
                    <Kanban />
                </Suspense>

                {/* Footer */}
                <footer className="px-6 py-12 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    <span>Revenue Dashboard · Mission 2029</span>
                </footer>
            </div>

            <SaveIndicator />
        </main>
    );
}