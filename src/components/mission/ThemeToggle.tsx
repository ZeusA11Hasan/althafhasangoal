import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Theme toggle for dark/light mode.
 * The CSS infrastructure already exists in styles.css — this just wires it up.
 */
export function ThemeToggle() {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark"),
    );

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark((d) => !d)}
            className="fixed top-6 right-6 z-50 neu p-3 rounded-full hover:bg-white/[0.03] transition text-muted-foreground hover:text-foreground"
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-label="Toggle theme"
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
    );
}