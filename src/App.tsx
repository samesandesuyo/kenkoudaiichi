import { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { PredictionCard } from './components/PredictionCard';
import { TodayLog } from './components/TodayLog';
import { WeekCalendar } from './components/WeekCalendar';
import { SettingsPanel } from './components/SettingsPanel';
import { Onboarding } from './components/Onboarding';
import { useHealthLog } from './hooks/useHealthLog';
import { useSettings } from './hooks/useSettings';
import { usePressureData } from './hooks/usePressureData';
import { buildPrediction, calcCyclePhaseForDate } from './utils/prediction';

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

const ONBOARDING_KEY = 'yozora-onboarding-done';

export default function App() {
  const { settings, saveSettings } = useSettings();
  const { getTodayLog, saveLog, getLogs, store } = useHealthLog();
  const pressure = usePressureData(settings.location.lat, settings.location.lon);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  const handleOnboardingComplete = (s: typeof settings) => {
    saveSettings(s);
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  const todayDate = getToday();
  const tomorrowDate = getTomorrow();

  const todayLog = getTodayLog();
  const recentLogs = getLogs(7);

  const defaultCyclePhase = useMemo(
    () => calcCyclePhaseForDate(settings, todayDate),
    [settings, todayDate]
  );

  const prediction = useMemo(
    () => buildPrediction(tomorrowDate, pressure.trend, recentLogs, settings),
    [tomorrowDate, pressure.trend, recentLogs, settings]
  );

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Layout onSettingsOpen={() => setSettingsOpen(true)}>
        <PredictionCard
          prediction={prediction}
          pressureLoading={pressure.loading}
          todayHpa={pressure.todayHpa}
          tomorrowHpa={pressure.tomorrowHpa}
        />
        <TodayLog
          todayDate={todayDate}
          defaultCyclePhase={defaultCyclePhase}
          existing={todayLog}
          pressureHpa={pressure.todayHpa}
          onSave={saveLog}
        />
        <WeekCalendar
          store={store}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
        />
      </Layout>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onSave={(s) => { saveSettings(s); setSettingsOpen(false); }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
