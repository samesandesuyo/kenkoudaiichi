import { useState, useCallback } from 'react';
import type { DailyLog } from '../types/health';

const STORAGE_KEY = 'yozora-health-logs';

type LogStore = Record<string, DailyLog>;

function loadStore(): LogStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useHealthLog() {
  const [store, setStore] = useState<LogStore>(loadStore);

  const persist = useCallback((next: LogStore) => {
    setStore(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getTodayLog = useCallback((): DailyLog | null => {
    return store[today()] ?? null;
  }, [store]);

  const getLog = useCallback((date: string): DailyLog | null => {
    return store[date] ?? null;
  }, [store]);

  const saveLog = useCallback((log: DailyLog) => {
    persist({ ...store, [log.date]: log });
  }, [store, persist]);

  const getLogs = useCallback((days: number): DailyLog[] => {
    const result: DailyLog[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (store[key]) result.push(store[key]);
    }
    return result;
  }, [store]);

  const deleteLog = useCallback((date: string) => {
    const next = { ...store };
    delete next[date];
    persist(next);
  }, [store, persist]);

  return { getTodayLog, getLog, saveLog, getLogs, deleteLog, store };
}
