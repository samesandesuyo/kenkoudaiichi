import { useState, useEffect, useRef, useCallback } from 'react';
import type { DailyLog, CyclePhase, EnergyLevel } from '../types/health';

interface Particle { id: number; x: number; y: number; color: string; tx: string; ty: string; }
const COLORS = ['#7F77DD', '#378ADD', '#1D9E75', '#E8EAF6', '#FFD700'];
let pid = 0;

interface Props {
  todayDate: string;
  defaultCyclePhase: CyclePhase;
  existing: DailyLog | null;
  pressureHpa: number | null;
  onSave: (log: DailyLog) => void;
}

const cyclePhaseOptions: { value: CyclePhase; label: string; emoji: string }[] = [
  { value: 'menstruation', label: '生理中', emoji: '🩸' },
  { value: 'follicular', label: '卵胞期', emoji: '🌱' },
  { value: 'ovulation', label: '排卵期', emoji: '✨' },
  { value: 'luteal', label: '黄体期', emoji: '🌕' },
];

const bedtimeOptions: string[] = (() => {
  const opts: string[] = [];
  for (let h = 21; h <= 26; h++) {
    for (const m of [0, 30]) {
      const hh = h < 24 ? h : h - 24;
      const suffix = h >= 24 ? '(翌)' : '';
      opts.push(`${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}${suffix}`);
    }
  }
  return opts;
})();

function bedtimeValue(label: string): string {
  return label.replace('(翌)', '');
}

function defaultLog(todayDate: string, cyclePhase: CyclePhase, pressureHpa: number | null): DailyLog {
  return {
    date: todayDate,
    energyLevel: 3,
    sleepHours: 7,
    bedtime: '23:00',
    proteinOk: false,
    goreiSan: false,
    cyclePhase,
    notes: '',
    pressureHpa,
  };
}

export function TodayLog({ todayDate, defaultCyclePhase, existing, pressureHpa, onSave }: Props) {
  const [log, setLog] = useState<DailyLog>(
    existing ?? defaultLog(todayDate, defaultCyclePhase, pressureHpa)
  );
  const [saved, setSaved] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripple, setRipple] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const spawnParticles = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const dist = 40 + Math.random() * 30;
      return {
        id: pid++,
        x: 50,
        y: 50,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        tx: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
        ty: '',
      };
    });
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  }, []);

  // existingが変わった場合に同期
  useEffect(() => {
    if (existing) {
      setLog(existing);
    }
  }, [existing]);

  // pressureHpaが後から取得された場合に反映（未保存のログのみ）
  useEffect(() => {
    if (!existing && pressureHpa !== null) {
      setLog((prev) => ({ ...prev, pressureHpa }));
    }
  }, [pressureHpa, existing]);

  const handleSave = () => {
    const toSave = { ...log, pressureHpa: pressureHpa ?? log.pressureHpa };
    onSave(toSave);
    setSaved(true);
    setRipple(false);
    requestAnimationFrame(() => setRipple(true));
    spawnParticles();
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => setRipple(false), 700);
  };

  const set = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
    setLog((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="mb-5 rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="text-xs mb-4" style={{ color: 'var(--color-muted)', fontFamily: "'Noto Serif JP', serif" }}>
        今日のログ <span style={{ color: 'var(--color-blue)' }}>{todayDate}</span>
      </p>

      {/* 体調レベル */}
      <div className="mb-5">
        <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>体調レベル</label>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as EnergyLevel[]).map((n) => (
            <button
              key={n}
              onClick={() => set('energyLevel', n)}
              className="w-10 h-10 rounded-full text-lg transition-all"
              style={{
                background: log.energyLevel === n ? 'var(--color-lavender)' : 'rgba(255,255,255,0.06)',
                border: log.energyLevel === n ? '2px solid var(--color-lavender)' : '2px solid var(--color-border)',
                transform: log.energyLevel === n ? 'scale(1.1)' : 'scale(1)',
              }}
              aria-label={`体調レベル ${n}`}
            >
              {n <= 2 ? '🔴' : n === 3 ? '🟡' : '🟢'}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          {log.energyLevel === 1 ? '最悪' : log.energyLevel === 2 ? '悪い' : log.energyLevel === 3 ? 'ふつう' : log.energyLevel === 4 ? '良い' : '絶好調'}
        </p>
      </div>

      {/* 睡眠時間 */}
      <div className="mb-5">
        <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
          睡眠時間 <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{log.sleepHours}時間</span>
        </label>
        <input
          type="range"
          min={4}
          max={10}
          step={0.5}
          value={log.sleepHours}
          onChange={(e) => set('sleepHours', parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: 'var(--color-blue)' }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          <span>4h</span><span>7h</span><span>10h</span>
        </div>
      </div>

      {/* 就寝時刻 */}
      <div className="mb-5">
        <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>就寝時刻</label>
        <div className="flex flex-wrap gap-2">
          {bedtimeOptions.map((opt) => {
            const val = bedtimeValue(opt);
            return (
              <button
                key={opt}
                onClick={() => set('bedtime', val)}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: log.bedtime === val ? 'var(--color-blue)' : 'rgba(255,255,255,0.06)',
                  color: log.bedtime === val ? '#fff' : 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* トグルスイッチ群 */}
      <div className="flex gap-4 mb-5">
        <ToggleSwitch
          label="朝タンパク質"
          emoji="🥚"
          checked={log.proteinOk}
          onChange={(v) => set('proteinOk', v)}
        />
        <ToggleSwitch
          label="五苓散"
          emoji="💊"
          checked={log.goreiSan}
          onChange={(v) => set('goreiSan', v)}
        />
      </div>

      {/* 生理周期フェーズ */}
      <div className="mb-5">
        <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>生理周期フェーズ</label>
        <div className="grid grid-cols-2 gap-2">
          {cyclePhaseOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set('cyclePhase', opt.value)}
              className="px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2"
              style={{
                background: log.cyclePhase === opt.value ? 'rgba(127,119,221,0.25)' : 'rgba(255,255,255,0.04)',
                border: log.cyclePhase === opt.value ? '1px solid var(--color-lavender)' : '1px solid var(--color-border)',
                color: log.cyclePhase === opt.value ? 'var(--color-lavender)' : 'var(--color-muted)',
              }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* メモ */}
      <div className="mb-5">
        <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>メモ（任意）</label>
        <textarea
          value={log.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="今日の体調メモ..."
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-blue)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        />
      </div>

      {/* 保存ボタン（演出付き） */}
      <div className="relative">
        <button
          ref={btnRef}
          onClick={handleSave}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all overflow-hidden relative"
          style={{
            background: saved ? 'var(--color-green)' : 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))',
            color: '#fff',
            transform: saved ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          {ripple && <span className="ripple-effect" />}
          {saved ? '✓ 保存しました' : existing ? '更新する' : '保存する'}
        </button>
        {/* 星パーティクル */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="star-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.color,
              '--burst-translate': p.tx,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </section>
  );
}

function ToggleSwitch({ label, emoji, checked, onChange }: {
  label: string;
  emoji: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
      style={{
        background: checked ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.04)',
        border: checked ? '1px solid var(--color-green)' : '1px solid var(--color-border)',
      }}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-xs" style={{ color: checked ? 'var(--color-green)' : 'var(--color-muted)' }}>{label}</span>
      <div className="w-8 h-4 rounded-full relative transition-colors" style={{ background: checked ? 'var(--color-green)' : 'var(--color-border)' }}>
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </div>
    </button>
  );
}
