import { get, set, del, createStore } from "idb-keyval";
import type { PersistStorage, StorageValue } from "zustand/middleware";

// Dedicated DB so it shows up clearly in DevTools.
const store = createStore("mission-2029-db", "kv");

export function createIdbStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name): Promise<StorageValue<T> | null> => {
      const value = await get<StorageValue<T>>(name, store);
      return value ?? null;
    },
    setItem: async (name, value) => {
      await set(name, value, store);
    },
    removeItem: async (name) => {
      await del(name, store);
    },
  };
}