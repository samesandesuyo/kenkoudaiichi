import { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { PredictionCard } from './components/PredictionCard';
import { TodayLog } from './components/TodayLog';
import { WeekCalendar } from './components/WeekCalendar';
import { SettingsPanel } from './components/SettingsPanel';
import { Onboarding } from './components/Onboarding';
import { useHealthLog } from './hooks/useHealthLog';
import { useSettings } from './hooks/useSettings';
import { useAuth } from './hooks/useAuth';
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

function LoginScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
         style={{ background: 'var(--color-bg)' }}>
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🌙</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          よぞら体調ナビ
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          スマホ・PCでデータを同期するためにログインが必要です
        </p>
      </div>
      <button
        onClick={onSignIn}
        className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Googleでログイン
      </button>
    </div>
  );
}

export default function App() {
  const { user, loading, signIn, logOut } = useAuth();
  const uid = user?.uid ?? null;

  const { settings, saveSettings, loaded } = useSettings(uid);
  const { getTodayLog, saveLog, getLogs, store, importLogs } = useHealthLog(uid);
  const pressure = usePressureData(settings.location.lat, settings.location.lon);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  if (loading || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'var(--color-bg)' }}>
        <div className="text-2xl animate-pulse">🌙</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onSignIn={signIn} />;
  }

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
      <Layout onSettingsOpen={() => setSettingsOpen(true)} onLogOut={logOut}>
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
          existingLogs={store}
          onImportLogs={(logs, newCycleStart) => {
            importLogs(logs);
            if (newCycleStart) {
              saveSettings({ ...settings, cycleStartDate: newCycleStart });
            }
          }}
        />
      )}
    </>
  );
}
