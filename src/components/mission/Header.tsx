import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function Header() {
    const router = useRouterState();
    const isRevenue = router.location.pathname === "/revenue";

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Navigation Toggle with Icons */}
            <nav className="flex items-center rounded-full bg-black/60 border border-white/20 p-1">
                <Link
                    to="/"
                    className="relative p-3 transition-colors duration-200"
                    title="Home"
                >
                    {!isRevenue && (
                        <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-full bg-white"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                    )}
                    <svg
                        className={`relative z-10 w-5 h-5 ${!isRevenue ? "text-black" : "text-white/70"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </Link>
                <Link
                    to="/revenue"
                    className="relative p-3 transition-colors duration-200"
                    title="Revenue"
                >
                    {isRevenue && (
                        <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-full bg-white"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                    )}
                    <svg
                        className={`relative z-10 w-5 h-5 ${isRevenue ? "text-black" : "text-white/70"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </Link>
            </nav>
        </div>
    );
}