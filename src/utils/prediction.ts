import type { CyclePhase, DailyLog, PredictionResult, UserSettings } from '../types/health';
import type { PressureTrend } from '../hooks/usePressureData';

// ─────────────────────────────────────────
// 生理周期フェーズ計算
// ─────────────────────────────────────────

export function calcCyclePhaseForDate(settings: UserSettings, date: string): CyclePhase {
  const start = new Date(settings.cycleStartDate);
  const target = new Date(date);
  const diff = Math.floor((target.getTime() - start.getTime()) / 86400000);
  const dayInCycle = ((diff % settings.cycleLength) + settings.cycleLength) % settings.cycleLength;

  if (dayInCycle < settings.periodLength) return 'menstruation';
  if (dayInCycle <= 12) return 'follicular';
  if (dayInCycle <= 15) return 'ovulation';
  return 'luteal';
}

/** 周期内の何日目か（0始まり） */
function getDayInCycle(settings: UserSettings, date: string): number {
  const start = new Date(settings.cycleStartDate);
  const target = new Date(date);
  const diff = Math.floor((target.getTime() - start.getTime()) / 86400000);
  return ((diff % settings.cycleLength) + settings.cycleLength) % settings.cycleLength;
}

// ─────────────────────────────────────────
// リスクスコア計算（0〜100）
// ─────────────────────────────────────────

interface RiskBreakdown {
  pressureRisk: number;    // 0〜30
  cycleRisk: number;       // 0〜30
  sleepRisk: number;       // 0〜25
  trendRisk: number;       // 0〜15（直近体調の下降トレンド）
  total: number;           // 0〜100
}

function calcPressureRisk(trend: PressureTrend): number {
  switch (trend) {
    case 'dropping': return 30;
    case 'stable':   return 0;
    case 'rising':   return -10; // ボーナス（マイナスリスク）
  }
}

function calcCycleRisk(settings: UserSettings, tomorrowDate: string): number {
  const phase = calcCyclePhaseForDate(settings, tomorrowDate);
  const dayInCycle = getDayInCycle(settings, tomorrowDate);
  const daysUntilPeriod = settings.cycleLength - dayInCycle;

  switch (phase) {
    case 'menstruation': return 30;
    case 'luteal':
      // 生理前3日以内は最大、それ以外は段階的に
      if (daysUntilPeriod <= 3) return 25;
      if (daysUntilPeriod <= 7) return 15;
      return 8;
    case 'ovulation': return -5;  // 排卵期はボーナス
    case 'follicular': return -8; // 卵胞期は最高
    default: return 0;
  }
}

function calcSleepRisk(recentLogs: DailyLog[]): number {
  if (recentLogs.length === 0) return 0;

  const last3 = recentLogs.slice(0, 3);

  // 平均睡眠時間
  const avgSleep = last3.reduce((s, l) => s + l.sleepHours, 0) / last3.length;

  // 就寝時刻ペナルティ（23時以降 = 遅い）
  const lateBedCount = last3.filter((l) => {
    const [h] = l.bedtime.split(':').map(Number);
    return h >= 23;
  }).length;

  let risk = 0;

  if (avgSleep < 5) risk += 25;
  else if (avgSleep < 6) risk += 18;
  else if (avgSleep < 7) risk += 10;
  else if (avgSleep >= 8) risk -= 5; // 十分な睡眠はボーナス

  risk += lateBedCount * 3; // 遅寝1日あたり+3

  return Math.min(risk, 25);
}

function calcTrendRisk(recentLogs: DailyLog[]): number {
  if (recentLogs.length < 2) return 0;

  const last3 = recentLogs.slice(0, 3);
  const avgEnergy = last3.reduce((s, l) => s + l.energyLevel, 0) / last3.length;

  // 直近3日の体調が低い
  if (avgEnergy <= 1.5) return 15;
  if (avgEnergy <= 2.5) return 10;
  if (avgEnergy <= 3.0) return 5;
  if (avgEnergy >= 4.5) return -5; // 好調継続ボーナス

  return 0;
}

function calcRisk(
  trend: PressureTrend,
  settings: UserSettings,
  tomorrowDate: string,
  recentLogs: DailyLog[],
): RiskBreakdown {
  const pressureRisk = calcPressureRisk(trend);
  const cycleRisk = calcCycleRisk(settings, tomorrowDate);
  const sleepRisk = calcSleepRisk(recentLogs);
  const trendRisk = calcTrendRisk(recentLogs);
  const raw = pressureRisk + cycleRisk + sleepRisk + trendRisk;
  const total = Math.max(0, Math.min(100, raw));

  return { pressureRisk, cycleRisk, sleepRisk, trendRisk, total };
}

// ─────────────────────────────────────────
// energyForecast 判定
// ─────────────────────────────────────────

function scoreToForecast(score: number): PredictionResult['energyForecast'] {
  if (score >= 35) return 'tough';
  if (score >= 15) return 'moderate';
  return 'good';
}

// ─────────────────────────────────────────
// アドバイス生成
// ─────────────────────────────────────────

interface AdviceContext {
  forecast: PredictionResult['energyForecast'];
  trend: PressureTrend;
  cyclePhase: CyclePhase;
  risk: RiskBreakdown;
  recentLogs: DailyLog[];
  settings: UserSettings;
  tomorrowDate: string;
}

function buildAdvice(ctx: AdviceContext): string[] {
  const { forecast, trend, cyclePhase, risk, recentLogs, settings, tomorrowDate } = ctx;
  const dayInCycle = getDayInCycle(settings, tomorrowDate);
  const daysUntilPeriod = settings.cycleLength - dayInCycle;
  const advice: string[] = [];

  // ─ コンボ最悪判定 ─
  if (trend === 'dropping' && cyclePhase === 'menstruation') {
    advice.push('気圧低下 × 生理中のダブルパンチ。今日は無条件で休養日にして🛌');
  } else if (trend === 'dropping' && daysUntilPeriod <= 3) {
    advice.push('気圧低下 × 生理直前のつらい組み合わせ。五苓散を今夜から飲んでおいて💊');
  } else if (trend === 'dropping') {
    advice.push('明日は気圧が下がります。五苓散を今夜から飲んでおくと◎');
  }

  // ─ 生理フェーズ別 ─
  if (cyclePhase === 'menstruation') {
    advice.push('生理中は録音や無理な作業は後回しにして。体が最優先');
  } else if (cyclePhase === 'luteal' && daysUntilPeriod <= 3) {
    advice.push(`生理まであと${daysUntilPeriod}日。エネルギー温存を意識して`);
  } else if (cyclePhase === 'luteal') {
    advice.push('黄体期は感情が揺れやすい時期。自分を責めなくていいよ');
  } else if (cyclePhase === 'ovulation' || cyclePhase === 'follicular') {
    if (forecast === 'good') {
      advice.push('明日はエネルギー高めの予測！よぞらの録音にもってこい✨');
    }
  }

  // ─ forecast別 ─
  if (forecast === 'good' && cyclePhase !== 'ovulation' && cyclePhase !== 'follicular') {
    advice.push('明日はコンディション良好の予測。やりたいことを優先してみて');
  }
  if (forecast === 'moderate') {
    advice.push('コーヒー1杯で乗り切れそうな日。無理しすぎず');
  }
  if (forecast === 'tough' && advice.length === 0) {
    advice.push('明日はゆっくりペースで。スケジュールに余白を作っておいて');
  }

  // ─ 睡眠チェック ─
  const last3 = recentLogs.slice(0, 3);
  if (last3.length >= 2) {
    const avgSleep = last3.reduce((s, l) => s + l.sleepHours, 0) / last3.length;
    const lateBedCount = last3.filter((l) => {
      const [h] = l.bedtime.split(':').map(Number);
      return h >= 23;
    }).length;

    if (avgSleep < 6) {
      advice.push(`直近${last3.length}日の平均睡眠が${avgSleep.toFixed(1)}時間。睡眠不足が積み重なってるかも`);
    } else if (lateBedCount >= 2) {
      advice.push('22時〜23時台に寝ると翌日の調子がぐっと上がりやすいよ');
    }
  }

  // ─ タンパク質チェック ─
  const noProteinCount = last3.filter((l) => !l.proteinOk).length;
  if (noProteinCount >= 2) {
    advice.push('朝のタンパク質が続けて取れていない。卵1個でもOKだよ🥚');
  }

  // ─ 好調が続いている場合 ─
  if (risk.total <= 5 && forecast === 'good') {
    advice.push('コンディション絶好調の流れ！この勢いでやりたいことを全力で');
  }

  // 最大4件、最低1件
  if (advice.length === 0) {
    advice.push('明日も穏やかな1日になりますように🌙');
  }

  return advice.slice(0, 4);
}

// ─────────────────────────────────────────
// メインエクスポート
// ─────────────────────────────────────────

export function buildPrediction(
  tomorrowDate: string,
  pressureTrend: PressureTrend,
  recentLogs: DailyLog[],
  settings: UserSettings,
): PredictionResult {
  const risk = calcRisk(pressureTrend, settings, tomorrowDate, recentLogs);
  const energyForecast = scoreToForecast(risk.total);
  const cyclePhase = calcCyclePhaseForDate(settings, tomorrowDate);

  const goreiSanRecommended = pressureTrend === 'dropping';
  const coffeeOk = energyForecast === 'moderate';
  const recordingRecommended = energyForecast === 'good';

  const advice = buildAdvice({
    forecast: energyForecast,
    trend: pressureTrend,
    cyclePhase,
    risk,
    recentLogs,
    settings,
    tomorrowDate,
  });

  return {
    date: tomorrowDate,
    energyForecast,
    pressureTrend,
    goreiSanRecommended,
    coffeeOk,
    recordingRecommended,
    advice,
  };
}
