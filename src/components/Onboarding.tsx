import { useState } from 'react';
import type { UserSettings } from '../types/health';

interface Props {
  onComplete: (settings: UserSettings) => void;
}

type Step = 0 | 1 | 2 | 3;

const STEP_TITLES = [
  'はじめまして',
  '生理開始日を教えて',
  '周期・期間を教えて',
  '準備完了！',
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [cycleStartDate, setCycleStartDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  const handleComplete = () => {
    onComplete({
      cycleStartDate: cycleStartDate || new Date().toISOString().slice(0, 10),
      cycleLength,
      periodLength,
      location: { lat: 34.6851, lon: 135.8049 },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--color-bg)', fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      {/* 星の背景 */}
      <div className="stars-bg" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm">
        {/* ステップインジケーター */}
        <div className="flex justify-center gap-2 mb-8">
          {([0, 1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width: s === step ? '24px' : '8px',
                height: '8px',
                background: s === step ? 'var(--color-lavender)' : s < step ? 'var(--color-blue)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* ステップ0: ようこそ */}
        {step === 0 && (
          <div className="text-center animate-fadein">
            <div className="text-6xl mb-6">🌙</div>
            <h1
              className="text-2xl mb-3"
              style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 700, color: 'var(--color-text)' }}
            >
              よぞら体調ナビ
            </h1>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-muted)' }}>
              気圧・生理周期・睡眠を記録して<br />翌日の体調を予測するアプリです。
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-muted)' }}>
              まず最初に、生理周期を教えてください。<br />あとで設定から変更できます。
            </p>
            <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))', color: '#fff' }}>
              はじめる ✦
            </button>
          </div>
        )}

        {/* ステップ1: 生理開始日 */}
        {step === 1 && (
          <div className="animate-fadein">
            <h2
              className="text-xl mb-2 text-center"
              style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 600, color: 'var(--color-text)' }}
            >
              {STEP_TITLES[1]}
            </h2>
            <p className="text-xs text-center mb-6" style={{ color: 'var(--color-muted)' }}>
              直近の生理が始まった日を選んでください
            </p>
            <input
              type="date"
              value={cycleStartDate}
              onChange={(e) => setCycleStartDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                colorScheme: 'dark',
              }}
            />
            <p className="text-xs text-center mb-6" style={{ color: 'var(--color-muted)' }}>
              わからない場合は空欄のまま次へ進めます
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl text-sm" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                戻る
              </button>
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))', color: '#fff' }}>
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ2: 周期・期間 */}
        {step === 2 && (
          <div className="animate-fadein">
            <h2
              className="text-xl mb-6 text-center"
              style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 600, color: 'var(--color-text)' }}
            >
              {STEP_TITLES[2]}
            </h2>

            {/* 生理周期 */}
            <div className="mb-6">
              <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
                生理周期　<span style={{ color: 'var(--color-blue)', fontWeight: 700 }}>{cycleLength}日</span>
              </label>
              <input
                type="range" min={21} max={35} step={1} value={cycleLength}
                onChange={(e) => setCycleLength(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--color-blue)' }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                <span>21日</span><span>28日</span><span>35日</span>
              </div>
            </div>

            {/* 生理期間 */}
            <div className="mb-8">
              <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
                生理期間　<span style={{ color: 'var(--color-blue)', fontWeight: 700 }}>{periodLength}日</span>
              </label>
              <input
                type="range" min={3} max={8} step={1} value={periodLength}
                onChange={(e) => setPeriodLength(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--color-blue)' }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                <span>3日</span><span>5日</span><span>8日</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                戻る
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))', color: '#fff' }}>
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ3: 完了 */}
        {step === 3 && (
          <div className="text-center animate-fadein">
            <div className="text-6xl mb-6">✨</div>
            <h2
              className="text-xl mb-3"
              style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 600, color: 'var(--color-text)' }}
            >
              準備完了！
            </h2>
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>生理周期</p>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>{cycleLength}日周期・{periodLength}日間</p>
              <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>生理開始日</p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>{cycleStartDate || '未設定（設定から変更できます）'}</p>
            </div>
            <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
              毎日のログ入力で予測の精度が上がります🌙
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))', color: '#fff' }}
            >
              アプリをはじめる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
