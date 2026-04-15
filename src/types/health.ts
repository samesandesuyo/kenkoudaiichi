export type CyclePhase =
  | 'menstruation'
  | 'follicular'
  | 'ovulation'
  | 'luteal'
  | 'unknown';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface DailyLog {
  date: string;
  energyLevel: EnergyLevel;
  sleepHours: number;
  bedtime: string;
  proteinOk: boolean;
  goreiSan: boolean;
  cyclePhase: CyclePhase;
  notes: string;
  pressureHpa: number | null;
}

export interface PredictionResult {
  date: string;
  energyForecast: 'good' | 'moderate' | 'tough';
  pressureTrend: 'rising' | 'stable' | 'dropping';
  goreiSanRecommended: boolean;
  coffeeOk: boolean;
  recordingRecommended: boolean;
  advice: string[];
}

export interface UserSettings {
  cycleStartDate: string;
  cycleLength: number;
  periodLength: number;
  location: {
    lat: number;
    lon: number;
  };
}
