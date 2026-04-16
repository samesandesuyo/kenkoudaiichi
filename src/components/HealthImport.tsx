import { useState, useRef } from 'react';
import type { DailyLog, EnergyLevel } from '../types/health';
import type { UserSettings } from '../types/health';
import {
  loadAppleHealthFile,
  parseAppleHealthXML,
  type ImportSummary,
} from '../utils/appleHealthParser';

interface Props {
  existingLogs: Record<string, DailyLog>;
  settings: UserSettings;
  onImport: (logs: Record<string, DailyLog>, newCycleStart: string | null) => void;
}

type Phase = 'idle' | 'loading' | 'preview' | 'done' | 'error';

const DEFAULT_LOG_VALUES: Omit<DailyLog, 'date'> = {
  energyLevel: 3 as EnergyLevel,
  sleepHours: 7,
  bedtime: '23:00',
  proteinOk: false,
  goreiSan: false,
  cyclePhase: 'unknown',
  notes: '',
  pressureHpa: null,
};

export function HealthImport({ existingLogs, settings, onImport }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pendingLogs, setPendingLogs] = useState<Record<string, Partial<DailyLog>>>({});
  const [skipExisting, setSkipExisting] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setPhase('loading');
    setError('');
    try {
      const xml = await loadAppleHealthFile(file);
      const { logs, summary } = parseAppleHealthXML(xml);
      setSummary(summary);
      setPendingLogs(logs);
      setPhase('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みエラー');
      setPhase('error');
    }
  };

  const handleConfirm = () => {
    const merged: Record<string, DailyLog> = { ...existingLogs };

    Object.entries(pendingLogs).forEach(([date, partial]) => {
      if (skipExisting && existingLogs[date]) return; // 既存ログを優先

      const existing = existingLogs[date] ?? { ...DEFAULT_LOG_VALUES, date };
      merged[date] = {
        ...existing,
        ...partial,
        date,
        // 既存の手動入力値は上書きしない（sleepHours・bedtimeは上書きOK）
        energyLevel: existing.energyLevel ?? DEFAULT_LOG_VALUES.energyLevel,
        proteinOk: existing.proteinOk ?? false,
        goreiSan: existing.goreiSan ?? false,
        notes: existing.notes ?? '',
        pressureHpa: existing.pressureHpa ?? null,
      };
    });

    onImport(merged, summary?.latestCycleStart ?? null);
    setPhase('done');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mt-4">
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(55,138,221,0.08)', border: '1px solid rgba(55,138,221,0.3)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span>🍎</span>
          <p className="text-sm font-bold" style={{ color: 'var(--color-blue)' }}>
            Apple Healthからインポート
          </p>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
          iPhoneのヘルスケアアプリからエクスポートした<br />
          .zipまたは.xmlファイルを読み込みます
        </p>

        {/* idle */}
        {phase === 'idle' && (
          <>
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-6 mb-3 cursor-pointer transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <span className="text-3xl mb-2">📂</span>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                タップしてファイルを選択<br />
                またはドラッグ＆ドロップ
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,.xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div className="text-xs rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-muted)' }}>
              <p className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>エクスポート手順（iPhone）</p>
              <p>① ヘルスケアアプリを開く</p>
              <p>② 右上のアイコン → プロフィール</p>
              <p>③「すべてのヘルスケアデータを書き出す」</p>
              <p>④ 生成されたZIPをここに読み込む</p>
            </div>
          </>
        )}

        {/* loading */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-blue)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              データを解析中...<br />
              <span className="text-xs">大きなファイルは少し時間がかかります</span>
            </p>
          </div>
        )}

        {/* preview */}
        {phase === 'preview' && summary && (
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-green)' }}>
              ✓ 解析完了！
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatBox label="睡眠データ" value={`${summary.sleepDays}日分`} emoji="🌙" />
              <StatBox label="生理データ" value={`${summary.menstrualDays}日分`} emoji="🩸" />
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
              期間：{summary.dateRange.from} 〜 {summary.dateRange.to}
            </p>
            {summary.latestCycleStart && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(127,119,221,0.15)', color: 'var(--color-lavender)' }}>
                💡 生理開始日を <b>{summary.latestCycleStart}</b> に更新します
              </p>
            )}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <div
                onClick={() => setSkipExisting(!skipExisting)}
                className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: skipExisting ? 'var(--color-blue)' : 'var(--color-border)' }}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: skipExisting ? '22px' : '2px' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                既存の手動入力ログを優先する
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPhase('idle')}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{ background: 'var(--color-surface)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))', color: '#fff' }}
              >
                インポートする
              </button>
            </div>
          </div>
        )}

        {/* done */}
        {phase === 'done' && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✨</p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-green)' }}>インポート完了！</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>予測精度が上がりました</p>
            <button
              onClick={() => setPhase('idle')}
              className="mt-3 px-4 py-1.5 rounded-full text-xs"
              style={{ background: 'var(--color-surface)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              もう一度読み込む
            </button>
          </div>
        )}

        {/* error */}
        {phase === 'error' && (
          <div className="py-3">
            <p className="text-sm mb-2" style={{ color: '#e57373' }}>⚠️ {error}</p>
            <button
              onClick={() => setPhase('idle')}
              className="px-4 py-1.5 rounded-full text-xs"
              style={{ background: 'var(--color-surface)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              やり直す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
      <p className="text-lg">{emoji}</p>
      <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
    </div>
  );
}
