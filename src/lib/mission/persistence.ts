import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Store the data file in the project root under a `data` directory
// This survives localhost restarts, browser cache clears, and device wipes.
const DATA_DIR = resolve(process.cwd(), "data");
const DATA_FILE = resolve(DATA_DIR, "mission-backup.json");

async function ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
    }
}

/**
 * Save mission data to a JSON file on disk.
 * Called from the client whenever the Zustand store changes.
 */
export const saveMissionData = createServerFn({ method: "POST" })
    .inputValidator(z.string().min(1))
    .handler(async ({ data: serialized }) => {
        try {
            await ensureDataDir();
            await writeFile(DATA_FILE, serialized, { encoding: "utf-8" });
            return { success: true, timestamp: Date.now() };
        } catch (error) {
            console.error("Failed to save mission data:", error);
            return { success: false, error: String(error) };
        }
    });

/**
 * Load mission data from the JSON file on disk.
 * Called on app startup to restore state.
 */
export const loadMissionData = createServerFn({ method: "GET" }).handler(async () => {
    try {
        if (!existsSync(DATA_FILE)) {
            return { success: true, data: null };
        }
        const content = await readFile(DATA_FILE, { encoding: "utf-8" });
        return { success: true, data: content };
    } catch (error) {
        console.error("Failed to load mission data:", error);
        return { success: false, data: null, error: String(error) };
    }
});