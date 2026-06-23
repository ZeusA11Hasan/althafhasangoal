/**
 * React hooks for the Time Tracking Engine.
 * Bridges TimeTrackingService and AnalyticsService to the UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { TimeSession, AnalyticsSnapshot, SessionType } from "./types";
import { TimeTrackingService } from "./TimeTrackingService";
import { AnalyticsService } from "./AnalyticsService";

/* ─────────────────────── useTimeSession ─────────────────────────────── */

interface UseTimeSessionReturn {
  session: TimeSession | null;
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  start: (taskName: string, type: SessionType, date?: string, category?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<TimeSession | null>;
  discard: () => Promise<void>;
}

export function useTimeSession(): UseTimeSessionReturn {
  const [session, setSession] = useState<TimeSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const s = await TimeTrackingService.getActiveSession();
    setSession(s);
    if (s) {
      setElapsed(TimeTrackingService.getLiveElapsed(s));
    } else {
      setElapsed(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = TimeTrackingService.subscribe(refresh);
    return () => {
      unsub();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    if (session && !session.completed && session.pausedAt === null) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (!session) return prev;
          return TimeTrackingService.getLiveElapsed(session);
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.id, session?.pausedAt, session?.completed]);

  const start = useCallback(
    async (taskName: string, type: SessionType, date?: string, category?: string) => {
      const s = await TimeTrackingService.startSession({ taskName, type, date, category });
      setSession(s);
      setElapsed(0);
    },
    [],
  );

  const pause = useCallback(async () => {
    const s = await TimeTrackingService.pauseSession();
    if (s) {
      setSession(s);
      setElapsed(TimeTrackingService.getLiveElapsed(s));
    }
  }, []);

  const resume = useCallback(async () => {
    const s = await TimeTrackingService.resumeSession();
    if (s) {
      setSession(s);
      setElapsed(TimeTrackingService.getLiveElapsed(s));
    }
  }, []);

  const stop = useCallback(async () => {
    const s = await TimeTrackingService.finalizeSession();
    if (s) {
      setSession(null);
      setElapsed(0);
      AnalyticsService.invalidateCache();
    }
    return s;
  }, []);

  const discard = useCallback(async () => {
    await TimeTrackingService.discardSession();
    setSession(null);
    setElapsed(0);
  }, []);

  return {
    session,
    elapsedSeconds: elapsed,
    isRunning: !!session && !session.completed && session.pausedAt === null,
    isPaused: !!session && !session.completed && session.pausedAt !== null,
    start,
    pause,
    resume,
    stop,
    discard,
  };
}

/* ─────────────────────── useAnalyticsData ───────────────────────────── */

export function useAnalyticsData(): {
  snapshot: AnalyticsSnapshot | null;
  loading: boolean;
  refetch: () => void;
} {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await AnalyticsService.getAnalyticsSnapshot();
    setSnapshot(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { snapshot, loading, refetch: fetch };
}

/* ─────────────────────── useTaskHoursChart ──────────────────────────── */

export function useTaskHoursChart() {
  const [data, setData] = useState<{ data: any[]; taskNames: string[] } | null>(null);

  useEffect(() => {
    AnalyticsService.getTaskHoursChartData().then(setData);
  }, []);

  return data;
}

/* ─────────────────────── useSessionRecovery ─────────────────────────── */

export function useSessionRecovery() {
  useEffect(() => {
    TimeTrackingService.recoverOrphanedSessions();
  }, []);
}
