import { useState, useCallback } from 'react';
import type { UserSettings } from '../types/health';

const STORAGE_KEY = 'yozora-settings';

const DEFAULT_SETTINGS: UserSettings = {
  cycleStartDate: '2026-04-01',
  cycleLength: 28,
  periodLength: 5,
  location: {
    lat: 34.6851,
    lon: 135.8049,
  },
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  const saveSettings = useCallback((next: UserSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { settings, saveSettings };
}
