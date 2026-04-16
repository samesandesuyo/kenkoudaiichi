import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DailyLog } from '../types/health';

type LogStore = Record<string, DailyLog>;

export function useHealthLog(uid: string | null) {
  const [store, setStore] = useState<LogStore>({});

  useEffect(() => {
    if (!uid) { setStore({}); return; }
    const logsRef = collection(db, 'users', uid, 'logs');
    return onSnapshot(logsRef, (snapshot) => {
      const next: LogStore = {};
      snapshot.forEach((d) => { next[d.id] = d.data() as DailyLog; });
      setStore(next);
    });
  }, [uid]);

  const getTodayLog = useCallback((): DailyLog | null => {
    return store[new Date().toISOString().slice(0, 10)] ?? null;
  }, [store]);

  const getLog = useCallback((date: string): DailyLog | null => {
    return store[date] ?? null;
  }, [store]);

  const saveLog = useCallback(async (log: DailyLog) => {
    if (!uid) return;
    await setDoc(doc(db, 'users', uid, 'logs', log.date), log);
  }, [uid]);

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

  const deleteLog = useCallback(async (date: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'logs', date));
  }, [uid]);

  const importLogs = useCallback(async (newStore: LogStore) => {
    if (!uid) return;
    await Promise.all(
      Object.entries(newStore).map(([date, log]) =>
        setDoc(doc(db, 'users', uid, 'logs', date), log)
      )
    );
  }, [uid]);

  return { getTodayLog, getLog, saveLog, getLogs, deleteLog, importLogs, store };
}
