/**
 * IndexedDB wrapper with LocalStorage fallback.
 * Stores TimeSession records reliably across tab switches and refreshes.
 */

import type { TimeSession } from "./types";

const DB_NAME = "Mission2029_TimeTracking";
const DB_VERSION = 1;
const STORE_NAME = "sessions";
const LS_FALLBACK_KEY = "tt_sessions_fallback";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("completed", "completed", { unique: false });
        store.createIndex("taskName", "taskName", { unique: false });
      }
    };
  });
  return dbPromise;
}

function fallbackToLS(sessions: TimeSession[]) {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore quota errors
  }
}

function readFallbackLS(): TimeSession[] {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as TimeSession[]) : [];
  } catch {
    return [];
  }
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    throw new Error("IDB unavailable");
  }
}

export const TimeDB = {
  async getAll(): Promise<TimeSession[]> {
    try {
      const sessions = await withStore("readonly", (s) => s.getAll());
      fallbackToLS(sessions);
      return sessions;
    } catch {
      return readFallbackLS();
    }
  },

  async getById(id: string): Promise<TimeSession | undefined> {
    try {
      return await withStore("readonly", (s) => s.get(id));
    } catch {
      return readFallbackLS().find((x) => x.id === id);
    }
  },

  async getByDate(date: string): Promise<TimeSession[]> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const idx = store.index("date");
      const req = idx.getAll(date);
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return readFallbackLS().filter((x) => x.date === date);
    }
  },

  async getActiveSessions(): Promise<TimeSession[]> {
    const all = await this.getAll();
    return all.filter((s) => !s.completed && s.endTime === null);
  },

  async put(session: TimeSession): Promise<void> {
    try {
      await withStore("readwrite", (s) => s.put(session));
      const all = await this.getAll();
      fallbackToLS(all);
    } catch {
      const all = readFallbackLS();
      const idx = all.findIndex((x) => x.id === session.id);
      if (idx >= 0) all[idx] = session;
      else all.push(session);
      fallbackToLS(all);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await withStore("readwrite", (s) => s.delete(id));
      const all = await this.getAll();
      fallbackToLS(all);
    } catch {
      const all = readFallbackLS().filter((x) => x.id !== id);
      fallbackToLS(all);
    }
  },

  async clear(): Promise<void> {
    try {
      await withStore("readwrite", (s) => s.clear());
      localStorage.removeItem(LS_FALLBACK_KEY);
    } catch {
      localStorage.removeItem(LS_FALLBACK_KEY);
    }
  },
};
