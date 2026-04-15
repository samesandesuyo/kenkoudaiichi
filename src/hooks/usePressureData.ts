import { useState, useEffect } from 'react';

export type PressureTrend = 'rising' | 'stable' | 'dropping';

export interface PressureData {
  todayHpa: number | null;
  tomorrowHpa: number | null;
  trend: PressureTrend;
  loading: boolean;
}

const SESSION_KEY = 'yozora-pressure-cache';

function calcAvg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function getTrend(today: number, tomorrow: number): PressureTrend {
  const diff = tomorrow - today;
  if (diff <= -3) return 'dropping';
  if (diff >= 3) return 'rising';
  return 'stable';
}

export function usePressureData(lat: number, lon: number): PressureData {
  const [data, setData] = useState<PressureData>({
    todayHpa: null,
    tomorrowHpa: null,
    trend: 'stable',
    loading: true,
  });

  useEffect(() => {
    const cacheKey = `${SESSION_KEY}-${lat}-${lon}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        return;
      } catch {
        // ignore
      }
    }

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=surface_pressure` +
      `&forecast_days=3` +
      `&timezone=Asia%2FTokyo`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const times: string[] = json.hourly.time;
        const pressures: number[] = json.hourly.surface_pressure;

        const todayStr = new Date().toISOString().slice(0, 10);
        const tomorrowStr = (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d.toISOString().slice(0, 10);
        })();

        const todayVals = pressures.filter((_, i) => times[i].startsWith(todayStr));
        const tomorrowVals = pressures.filter((_, i) => times[i].startsWith(tomorrowStr));

        const todayHpa = todayVals.length > 0 ? Math.round(calcAvg(todayVals)) : null;
        const tomorrowHpa = tomorrowVals.length > 0 ? Math.round(calcAvg(tomorrowVals)) : null;
        const trend =
          todayHpa !== null && tomorrowHpa !== null
            ? getTrend(todayHpa, tomorrowHpa)
            : 'stable';

        const result: PressureData = {
          todayHpa,
          tomorrowHpa,
          trend,
          loading: false,
        };
        setData(result);
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      })
      .catch(() => {
        setData({ todayHpa: null, tomorrowHpa: null, trend: 'stable', loading: false });
      });
  }, [lat, lon]);

  return data;
}
