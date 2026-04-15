import type { PredictionResult } from '../types/health';

interface Props {
  prediction: PredictionResult | null;
  pressureLoading: boolean;
  todayHpa: number | null;
  tomorrowHpa: number | null;
}

const forecastIcon = {
  good: '🌟',
  moderate: '🌙',
  tough: '🌧',
};

const forecastLabel = {
  good: '絶好調の予感',
  moderate: 'まずまずの日',
  tough: 'ゆっくりデー',
};

const forecastColor = {
  good: 'var(--color-green)',
  moderate: 'var(--color-blue)',
  tough: 'var(--color-lavender)',
};

const trendIcon = {
  rising: '↑',
  stable: '→',
  dropping: '↓',
};

const trendLabel = {
  rising: '上昇',
  stable: '安定',
  dropping: '低下',
};

const trendColor = {
  rising: 'var(--color-green)',
  stable: 'var(--color-blue)',
  dropping: '#e57373',
};

export function PredictionCard({ prediction, pressureLoading, todayHpa, tomorrowHpa }: Props) {
  return (
    <section className="mb-5 rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--color-muted)', fontFamily: "'Noto Serif JP', serif" }}>
        明日の予測
      </p>

      {prediction === null ? (
        <div className="flex items-center gap-2 py-4" style={{ color: 'var(--color-muted)' }}>
          <span className="animate-pulse">✦</span>
          <span className="text-sm">データを取得中...</span>
        </div>
      ) : (
        <>
          {/* メイン予測 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{forecastIcon[prediction.energyForecast]}</span>
            <div>
              <p className="text-xl font-bold" style={{ color: forecastColor[prediction.energyForecast], fontFamily: "'Noto Serif JP', serif" }}>
                {forecastLabel[prediction.energyForecast]}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{prediction.date}</p>
            </div>
          </div>

          {/* 気圧情報 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: trendColor[prediction.pressureTrend], fontWeight: 700, fontSize: '1rem' }}>
                {trendIcon[prediction.pressureTrend]}
              </span>
              <span style={{ color: 'var(--color-muted)' }}>気圧</span>
              <span style={{ color: trendColor[prediction.pressureTrend], fontWeight: 600 }}>
                {trendLabel[prediction.pressureTrend]}
              </span>
            </div>
            {pressureLoading ? (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>気圧データ取得中...</span>
            ) : (
              todayHpa !== null && tomorrowHpa !== null && (
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  今日 {todayHpa} hPa → 明日 {tomorrowHpa} hPa
                </span>
              )
            )}
          </div>

          {/* バッジ */}
          <div className="flex flex-wrap gap-2 mb-4">
            {prediction.goreiSanRecommended && (
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(229,115,115,0.2)', color: '#e57373', border: '1px solid rgba(229,115,115,0.4)' }}>
                💊 五苓散を飲んで！
              </span>
            )}
            {prediction.recordingRecommended && (
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(29,158,117,0.2)', color: 'var(--color-green)', border: '1px solid rgba(29,158,117,0.4)' }}>
                🎙 録音推奨日✨
              </span>
            )}
            {prediction.coffeeOk && (
              <span className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(55,138,221,0.2)', color: 'var(--color-blue)', border: '1px solid rgba(55,138,221,0.4)' }}>
                ☕ コーヒーOK
              </span>
            )}
          </div>

          {/* アドバイス */}
          <ul className="space-y-1.5">
            {prediction.advice.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                <span style={{ color: 'var(--color-lavender)', marginTop: '2px', flexShrink: 0 }}>✦</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
