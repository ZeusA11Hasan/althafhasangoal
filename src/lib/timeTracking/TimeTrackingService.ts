/**
 * TimeTrackingService
 * Centralized engine for creating, updating, and finalizing time sessions.
 * Uses timestamps (not incrementing counters) to prevent drift.
 * Survives tab switches, refreshes, and page navigation via IndexedDB.
 */

import type { TimeSession, SessionCreateInput, SessionType } from "./types";
import { TimeDB } from "./db";
import { istDateKey } from "@/lib/mission/store";

const AUTO_SAVE_INTERVAL_MS = 3000;

function generateId() {
  return crypto.randomUUID();
}

class TimeTrackingServiceClass {
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private currentSessionId: string | null = null;
  private listeners: Set<() => void> = new Set();

  /** Subscribe to session state changes (active/inactive) */
  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    this.listeners.forEach((cb) => cb());
  }

  /** Start tracking a new session. If an active session exists, finalizes it first. */
  async startSession(input: SessionCreateInput): Promise<TimeSession> {
    await this.finalizeAnyActive();

    const now = Date.now();
    const session: TimeSession = {
      id: generateId(),
      taskId: input.taskId,
      taskName: input.taskName.trim() || "Untitled",
      category: input.category ?? input.taskName.trim() ?? "General",
      type: input.type,
      startTime: now,
      endTime: null,
      durationSeconds: 0,
      date: input.date ?? istDateKey(),
      completed: false,
      totalPausedMs: 0,
      pausedAt: null,
    };

    await TimeDB.put(session);
    this.currentSessionId = session.id;
    this.startAutoSave();
    this.emit();
    return session;
  }

  /** Pause the active session. */
  async pauseSession(sessionId?: string): Promise<TimeSession | null> {
    const id = sessionId ?? this.currentSessionId;
    if (!id) return null;
    const s = await TimeDB.getById(id);
    if (!s || s.completed || s.pausedAt !== null) return s ?? null;

    const now = Date.now();
    const elapsed = now - s.startTime - s.totalPausedMs;
    const updated: TimeSession = {
      ...s,
      durationSeconds: Math.max(0, Math.floor(elapsed / 1000)),
      pausedAt: now,
    };
    await TimeDB.put(updated);
    this.emit();
    return updated;
  }

  /** Resume a paused session. */
  async resumeSession(sessionId?: string): Promise<TimeSession | null> {
    const id = sessionId ?? this.currentSessionId;
    if (!id) return null;
    const s = await TimeDB.getById(id);
    if (!s || s.completed || s.pausedAt === null) return s ?? null;

    const now = Date.now();
    const additionalPause = now - s.pausedAt;
    const updated: TimeSession = {
      ...s,
      totalPausedMs: s.totalPausedMs + additionalPause,
      pausedAt: null,
    };
    await TimeDB.put(updated);
    this.emit();
    return updated;
  }

  /** Finalize a session (mark completed with exact duration). */
  async finalizeSession(sessionId?: string): Promise<TimeSession | null> {
    const id = sessionId ?? this.currentSessionId;
    if (!id) return null;
    const s = await TimeDB.getById(id);
    if (!s || s.completed) return s ?? null;

    const now = Date.now();
    let totalPaused = s.totalPausedMs;
    if (s.pausedAt !== null) {
      totalPaused += now - s.pausedAt;
    }
    const elapsed = now - s.startTime - totalPaused;
    const updated: TimeSession = {
      ...s,
      endTime: now,
      durationSeconds: Math.max(0, Math.floor(elapsed / 1000)),
      completed: true,
      totalPausedMs: totalPaused,
      pausedAt: null,
    };
    await TimeDB.put(updated);
    if (this.currentSessionId === id) {
      this.currentSessionId = null;
      this.stopAutoSave();
    }
    this.emit();
    return updated;
  }

  /** Finalize any currently active session (useful before starting a new one). */
  async finalizeAnyActive(): Promise<void> {
    if (this.currentSessionId) {
      await this.finalizeSession(this.currentSessionId);
      return;
    }
    const active = await TimeDB.getActiveSessions();
    for (const s of active) {
      await this.finalizeSession(s.id);
    }
  }

  /** Discard a session without recording it. */
  async discardSession(sessionId?: string): Promise<void> {
    const id = sessionId ?? this.currentSessionId;
    if (!id) return;
    await TimeDB.delete(id);
    if (this.currentSessionId === id) {
      this.currentSessionId = null;
      this.stopAutoSave();
    }
    this.emit();
  }

  /** Get the currently active session, if any. */
  async getActiveSession(): Promise<TimeSession | null> {
    if (this.currentSessionId) {
      const s = await TimeDB.getById(this.currentSessionId);
      if (s && !s.completed) return s;
    }
    const active = await TimeDB.getActiveSessions();
    if (active.length > 0) {
      this.currentSessionId = active[0].id;
      return active[0];
    }
    return null;
  }

  /** Compute live elapsed seconds for an active session. */
  getLiveElapsed(session: TimeSession): number {
    if (session.completed || session.endTime !== null) {
      return session.durationSeconds;
    }
    const now = Date.now();
    let paused = session.totalPausedMs;
    if (session.pausedAt !== null) {
      paused += now - session.pausedAt;
    }
    return Math.max(0, Math.floor((now - session.startTime - paused) / 1000));
  }

  /** Auto-save active session every few seconds. */
  private startAutoSave() {
    if (this.autoSaveTimer) return;
    this.autoSaveTimer = setInterval(async () => {
      const id = this.currentSessionId;
      if (!id) return;
      const s = await TimeDB.getById(id);
      if (!s || s.completed) return;
      const elapsed = this.getLiveElapsed(s);
      const updated: TimeSession = { ...s, durationSeconds: elapsed };
      await TimeDB.put(updated);
    }, AUTO_SAVE_INTERVAL_MS);
  }

  private stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /** On app startup, recover any orphaned active sessions and finalize them. */
  async recoverOrphanedSessions(): Promise<void> {
    const active = await TimeDB.getActiveSessions();
    for (const s of active) {
      // If the session has been active for > 4 hours, likely abandoned
      const elapsed = Date.now() - s.startTime - s.totalPausedMs;
      if (elapsed > 4 * 60 * 60 * 1000) {
        await this.finalizeSession(s.id);
      }
    }
  }

  /** Get all sessions. */
  async getAllSessions(): Promise<TimeSession[]> {
    return TimeDB.getAll();
  }

  /** Get sessions by date. */
  async getSessionsByDate(date: string): Promise<TimeSession[]> {
    return TimeDB.getByDate(date);
  }

  /** Create a break session linked to a preceding focus session. */
  async startBreakSession(
    focusSessionId: string,
    breakTaskName = "Break",
    date?: string,
  ): Promise<TimeSession> {
    await this.finalizeSession(focusSessionId);
    return this.startSession({
      taskName: breakTaskName,
      type: "break",
      date: date ?? istDateKey(),
    });
  }

  /** Convenience: start a focus session. */
  startFocusSession(taskName: string, date?: string, category?: string) {
    return this.startSession({
      taskName,
      type: "focus",
      date: date ?? istDateKey(),
      category,
    });
  }

  /** Convenience: start a sleep session. */
  startSleepSession(date?: string) {
    return this.startSession({
      taskName: "Sleep",
      type: "sleep",
      date: date ?? istDateKey(),
      category: "Health",
    });
  }

  /** Convenience: start a workout session. */
  startWorkoutSession(taskName = "Workout", date?: string) {
    return this.startSession({
      taskName,
      type: "workout",
      date: date ?? istDateKey(),
      category: "Fitness",
    });
  }

  /** Convenience: start a deepwork session. */
  startDeepWorkSession(taskName = "Deep Work", date?: string) {
    return this.startSession({
      taskName,
      type: "deepwork",
      date: date ?? istDateKey(),
      category: "Productivity",
    });
  }
}

export const TimeTrackingService = new TimeTrackingServiceClass();
