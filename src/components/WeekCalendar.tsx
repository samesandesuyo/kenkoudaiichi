import type { DailyLog } from '../types/health';

interface Props {
  store: Record<string, DailyLog>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

function energyDot(level: number): string {
  if (level <= 2) return '🔴';
  if (level === 3) return '🟡';
  return '🟢';
}

function cycleEmoji(phase: string): string {
  switch (phase) {
    case 'menstruation': return '🩸';
    case 'follicular': return '🌱';
    case 'ovulation': return '✨';
    case 'luteal': return '🌕';
    default: return '';
  }
}

export function WeekCalendar({ store, selectedDate, onSelectDate }: Props) {
  const days: { dateStr: string; date: Date }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ dateStr: d.toISOString().slice(0, 10), date: d });
  }

  return (
    <section className="rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--color-muted)', fontFamily: "'Noto Serif JP', serif" }}>
        週間カレンダー
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ dateStr, date }) => {
          const log = store[dateStr];
          const isToday = dateStr === now.toISOString().slice(0, 10);
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = date.getDay();

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="flex flex-col items-center py-2 rounded-xl transition-all"
              style={{
                background: isSelected ? 'rgba(127,119,221,0.2)' : isToday ? 'rgba(55,138,221,0.1)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid var(--color-lavender)' : isToday ? '1px solid rgba(55,138,221,0.4)' : '1px solid transparent',
              }}
            >
              <span
                className="text-xs"
                style={{ color: dayOfWeek === 0 ? '#e57373' : dayOfWeek === 6 ? 'var(--color-blue)' : 'var(--color-muted)' }}
              >
                {DAY_JP[dayOfWeek]}
              </span>
              <span
                className="text-sm font-bold mt-0.5"
                style={{ color: isToday ? 'var(--color-blue)' : 'var(--color-text)' }}
              >
                {date.getDate()}
              </span>
              <span className="text-xs mt-1 h-4 flex items-center">
                {log ? energyDot(log.energyLevel) : <span style={{ color: 'var(--color-border)' }}>·</span>}
              </span>
              <span className="text-xs h-4 flex items-center">
                {log ? cycleEmoji(log.cyclePhase) : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* 選択日のログ詳細 */}
      {selectedDate && store[selectedDate] && selectedDate !== now.toISOString().slice(0, 10) && (
        <LogDetail log={store[selectedDate]} />
      )}
    </section>
  );
}

function LogDetail({ log }: { log: DailyLog }) {
  const phaseLabel: Record<string, string> = {
    menstruation: '生理中',
    follicular: '卵胞期',
    ovulation: '排卵期',
    luteal: '黄体期',
    unknown: '不明',
  };

  return (
    <div className="mt-3 pt-3 text-sm" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>{log.date} のログ</p>
      <div className="grid grid-cols-2 gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
        <span>体調: <b style={{ color: 'var(--color-text)' }}>{energyDot(log.energyLevel)} Lv.{log.energyLevel}</b></span>
        <span>睡眠: <b style={{ color: 'var(--color-text)' }}>{log.sleepHours}h</b></span>
        <span>就寝: <b style={{ color: 'var(--color-text)' }}>{log.bedtime}</b></span>
        <span>フェーズ: <b style={{ color: 'var(--color-text)' }}>{phaseLabel[log.cyclePhase]}</b></span>
        <span>タンパク質: <b style={{ color: log.proteinOk ? 'var(--color-green)' : '#e57373' }}>{log.proteinOk ? '✓' : '✗'}</b></span>
        <span>五苓散: <b style={{ color: log.goreiSan ? 'var(--color-green)' : '#e57373' }}>{log.goreiSan ? '✓' : '✗'}</b></span>
        {log.pressureHpa && <span>気圧: <b style={{ color: 'var(--color-text)' }}>{log.pressureHpa} hPa</b></span>}
      </div>
      {log.notes && (
        <p className="mt-2 text-xs italic" style={{ color: 'var(--color-muted)' }}>"{log.notes}"</p>
      )}
    </div>
  );
}
