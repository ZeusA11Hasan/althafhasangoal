import { motion } from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   Premium Loaders — Minimal, dark, no layout-shift
   ────────────────────────────────────────────────────────────── */

const Shimmer = ({ className = "" }: { className?: string }) => (
    <motion.div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent ${className}`}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
    />
);

/** Generic section loader — replaces the old py-24 monster */
export function PremiumSectionLoader() {
    return (
        <div className="w-full px-6 py-16 relative overflow-hidden">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-3">
                    <div className="h-2.5 w-36 bg-white/[0.04] rounded-full relative overflow-hidden" />
                    <div className="h-8 w-72 bg-white/[0.03] rounded-lg relative overflow-hidden" />
                </div>
                <div className="rounded-xl border border-white/[0.04] p-6 relative overflow-hidden bg-white/[0.01]">
                    <Shimmer />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-3 bg-white/[0.04] rounded-full relative overflow-hidden ${i === 0 ? "w-3/4" : i === 1 ? "w-full" : "w-5/6"}`}
                            >
                                <Shimmer />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Card-sized loader */
export function PremiumCardLoader({ className = "" }: { className?: string }) {
    return (
        <div
            className={`rounded-xl bg-white/[0.02] border border-white/[0.04] p-5 relative overflow-hidden ${className}`}
        >
            <Shimmer />
            <div className="space-y-2.5 relative z-10">
                <div className="h-3 w-2/3 bg-white/[0.06] rounded-full" />
                <div className="h-2.5 w-full bg-white/[0.03] rounded-full" />
                <div className="h-2.5 w-3/4 bg-white/[0.03] rounded-full" />
            </div>
        </div>
    );
}

/** Tiny spinner for buttons / micro-interactions */
export function PremiumSpinner({
    size = "md",
    className = "",
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const s = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" }[size];
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <motion.div
                className={`${s} rounded-full border-[1.5px] border-white/10 border-t-white/60`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}

/** Kanban-specific loader — mimics 4 columns without the huge padding */
export function KanbanLoader() {
    return (
        <div className="w-full px-6 py-12">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-3">
                    <div className="h-2.5 w-32 bg-white/[0.04] rounded-full relative overflow-hidden" />
                    <div className="h-10 w-2/3 bg-white/[0.03] rounded-lg relative overflow-hidden" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 space-y-3"
                        >
                            <div className="h-5 w-20 bg-white/[0.06] rounded-full relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <PremiumCardLoader />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Chart / analytics loader */
export function ChartLoader() {
    return (
        <div className="w-full px-6 py-12">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-3">
                    <div className="h-2.5 w-40 bg-white/[0.04] rounded-full relative overflow-hidden" />
                    <div className="h-9 w-80 bg-white/[0.03] rounded-lg relative overflow-hidden" />
                </div>
                <div className="h-56 rounded-xl bg-white/[0.01] border border-white/[0.04] relative overflow-hidden flex items-end justify-center p-6">
                    <div className="flex items-end space-x-2 h-full w-full">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 bg-white/[0.04] rounded-t"
                                initial={{ height: "20%" }}
                                animate={{ height: [`${20 + i * 4}%`, `${50 + i * 3}%`, `${20 + i * 4}%`] }}
                                transition={{
                                    duration: 2,
                                    delay: i * 0.08,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Full-page transition overlay — subtle, no blur storm */
export function PremiumPageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
            >
                <PremiumSpinner size="lg" />
                <motion.p
                    className="text-xs text-white/40 font-medium tracking-widest uppercase"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    Loading
                </motion.p>
            </motion.div>
        </div>
    );
}

/** Button loading state wrapper */
export function ButtonLoader({
    children,
    loading,
    ...props
}: {
    children: React.ReactNode;
    loading: boolean;
    [key: string]: any;
}) {
    return (
        <button {...props} disabled={loading}>
            <div className="flex items-center gap-2">
                {loading && <PremiumSpinner size="sm" />}
                <span className={loading ? "opacity-60" : ""}>{children}</span>
            </div>
        </button>
    );
}
