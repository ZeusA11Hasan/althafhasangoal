import { useEffect, useRef, useState, useCallback } from "react";
import { useMission } from "@/lib/mission/store";
import { saveMissionData, loadMissionData } from "@/lib/mission/persistence";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 2000; // 2 seconds after last change

/**
 * Auto-save hook: subscribes to Zustand store changes and persists
 * to a JSON file on disk via the TanStack Start server API.
 *
 * On mount, attempts to load saved data from disk first (overrides localStorage).
 * On every store change, debounces and saves to disk.
 *
 * Provides save status for UI indicators.
 */
export function useAutoSave() {
    const [status, setStatus] = useState<SaveStatus>("idle");
    const [lastSaved, setLastSaved] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadedRef = useRef(false);

    // Load from disk on first mount
    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        (async () => {
            try {
                const result = await loadMissionData();
                if (result.success && result.data) {
                    const parsed = JSON.parse(result.data);
                    // Only restore if we have meaningful data
                    if (parsed && typeof parsed === "object" && "missionTarget" in parsed) {
                        useMission.setState(parsed);
                        console.log("📂 Restored mission data from disk backup");
                    }
                }
            } catch (err) {
                // First visit — no backup yet, that's fine
                console.log("ℹ️ No disk backup found (first visit)");
            }
        })();
    }, []);

    // Subscribe to all store changes and auto-save
    useEffect(() => {
        const unsub = useMission.subscribe((state) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            setStatus("saving");
            timerRef.current = setTimeout(async () => {
                try {
                    const serialized = JSON.stringify(state);
                    const result = await saveMissionData({ data: serialized });
                    if (result.success) {
                        setStatus("saved");
                        setLastSaved(result.timestamp ?? Date.now());
                    } else {
                        setStatus("error");
                        console.error("Auto-save failed:", result.error);
                    }
                } catch (err) {
                    setStatus("error");
                    console.error("Auto-save error:", err);
                }
            }, SAVE_DEBOUNCE_MS);
        });

        return () => {
            unsub();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    /** Manually trigger an immediate save */
    const saveNow = useCallback(async () => {
        setStatus("saving");
        try {
            const state = useMission.getState();
            const serialized = JSON.stringify(state);
            const result = await saveMissionData({ data: serialized });
            if (result.success) {
                setStatus("saved");
                setLastSaved(result.timestamp ?? Date.now());
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    }, []);

    return { status, lastSaved, saveNow };
}