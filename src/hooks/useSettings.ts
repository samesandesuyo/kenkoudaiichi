import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserSettings } from '../types/health';

const DEFAULT_SETTINGS: UserSettings = {
  cycleStartDate: '2026-04-01',
  cycleLength: 28,
  periodLength: 5,
  location: {
    lat: 34.6851,
    lon: 135.8049,
  },
};

export function useSettings(uid: string | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid) { setLoaded(true); return; }
    const ref = doc(db, 'users', uid, 'settings', 'main');
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() as UserSettings });
      }
      setLoaded(true);
    }, (err) => {
      console.error('useSettings onSnapshot error:', err);
      setLoaded(true);
    });
  }, [uid]);

  const saveSettings = useCallback(async (next: UserSettings) => {
    setSettings(next);
    if (!uid) return;
    await setDoc(doc(db, 'users', uid, 'settings', 'main'), next);
  }, [uid]);

  return { settings, saveSettings, loaded };
}
