import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import { useAutoSave, type SaveStatus } from "@/lib/mission/useAutoSave";

const STATUS_CONFIG: Record<
    SaveStatus,
    { icon: typeof Check; label: string; color: string }
> = {
    idle: { icon: CloudOff, label: "Ready", color: "text-muted-foreground" },
    saving: { icon: Loader2, label: "Saving...", color: "text-warning" },
    saved: { icon: Check, label: "Saved", color: "text-success" },
    error: { icon: CloudOff, label: "Save failed", color: "text-danger" },
};

/**
 * Subtle save status indicator shown in the bottom-left corner.
 * Shows the current auto-save status and a manual save button.
 */
export function SaveIndicator() {
    const { status, saveNow } = useAutoSave();
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;

    return (
        <button
            onClick={saveNow}
            disabled={status === "saving"}
            className="fixed bottom-6 left-24 z-40 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.06] px-4 py-2 text-[10px] uppercase tracking-[0.3em] hover:bg-white/[0.03] transition"
            title="Click to save now"
        >
            <Icon
                className={`h-3 w-3 ${cfg.color} ${status === "saving" ? "animate-spin" : ""}`}
            />
            <span className={cfg.color}>{cfg.label}</span>
        </button>
    );
}