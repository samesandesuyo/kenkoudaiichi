import { useState } from 'react';
import type { UserSettings } from '../types/health';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.1rem', fontWeight: 600 }}>設定</h2>
        <button onClick={onClose} className="p-2 rounded-full" style={{ color: 'var(--color-muted)' }} aria-label="閉じる">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {/* 生理開始日 */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>直近の生理開始日</label>
          <input
            type="date"
            value={form.cycleStartDate}
            onChange={(e) => set('cycleStartDate', e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* 生理周期 */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
            生理周期 <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{form.cycleLength}日</span>
          </label>
          <input
            type="range"
            min={21}
            max={35}
            step={1}
            value={form.cycleLength}
            onChange={(e) => set('cycleLength', parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: 'var(--color-blue)' }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            <span>21日</span><span>28日</span><span>35日</span>
          </div>
        </div>

        {/* 生理期間 */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
            生理期間 <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{form.periodLength}日</span>
          </label>
          <input
            type="range"
            min={3}
            max={8}
            step={1}
            value={form.periodLength}
            onChange={(e) => set('periodLength', parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: 'var(--color-blue)' }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            <span>3日</span><span>5日</span><span>8日</span>
          </div>
        </div>

        {/* 位置情報 */}
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--color-muted)' }}>位置情報（気圧取得用）</label>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>デフォルト：奈良市 (34.6851, 135.8049)</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>緯度</label>
              <input
                type="number"
                step="0.0001"
                value={form.location.lat}
                onChange={(e) => set('location', { ...form.location, lat: parseFloat(e.target.value) })}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>経度</label>
              <input
                type="number"
                step="0.0001"
                value={form.location.lon}
                onChange={(e) => set('location', { ...form.location, lon: parseFloat(e.target.value) })}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
          </div>
        </div>

        {/* データ注意 */}
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          ※ データはすべてこの端末のlocalStorageにのみ保存されます。
        </p>
      </div>

      {/* 保存ボタン */}
      <div className="px-4 py-4 max-w-lg mx-auto w-full" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: saved ? 'var(--color-green)' : 'linear-gradient(135deg, var(--color-blue), var(--color-lavender))',
            color: '#fff',
          }}
        >
          {saved ? '✓ 保存しました' : '設定を保存する'}
        </button>
      </div>
    </div>
  );
}
