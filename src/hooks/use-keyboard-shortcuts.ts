import { useEffect } from "react";

export interface ShortcutMap {
    /** Toggle War Mode */
    onWarMode?: () => void;
    /** Toggle AI Coach */
    onAICoach?: () => void;
    /** Start/Pause Pomodoro */
    onPomodoro?: () => void;
    /** Focus task input */
    onTaskInput?: () => void;
    /** Open today's calendar */
    onCalendar?: () => void;
}

/**
 * Global keyboard shortcuts for power users.
 * Automatically ignores shortcuts when focus is in an input/textarea.
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcuts({
 *   onWarMode: () => setWarModeOpen(true),
 *   onAICoach: () => setCoachOpen(true),
 * })
 * ```
 */
export function useKeyboardShortcuts(handlers: ShortcutMap) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ignore when user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            ) {
                return;
            }

            switch (e.key) {
                case "w":
                case "W":
                    handlers.onWarMode?.();
                    break;
                case "c":
                case "C":
                    handlers.onAICoach?.();
                    break;
                case " ":
                    e.preventDefault();
                    handlers.onPomodoro?.();
                    break;
                case "t":
                case "T":
                    handlers.onTaskInput?.();
                    break;
                case "d":
                case "D":
                    handlers.onCalendar?.();
                    break;
                case "Escape":
                    // Esc is typically handled per-component via modals
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handlers]);
}