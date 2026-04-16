import JSZip from 'jszip';
import type { DailyLog, CyclePhase } from '../types/health';

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────

interface SleepSegment {
  start: Date;
  end: Date;
  isActualSleep: boolean; // InBedではなく実際の睡眠
}

interface DayData {
  sleepSegments: SleepSegment[];
  inBedSegments: SleepSegment[];
  hasMenstrualFlow: boolean;
}

export interface ImportSummary {
  totalDays: number;
  sleepDays: number;
  menstrualDays: number;
  dateRange: { from: string; to: string };
  latestCycleStart: string | null;
}

export interface ParseResult {
  logs: Record<string, Partial<DailyLog>>;
  summary: ImportSummary;
}

// ─────────────────────────────────────────
// ファイル読み込み（ZIP or XML）
// ─────────────────────────────────────────

export async function loadAppleHealthFile(file: File): Promise<string> {
  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    // apple_health_export/export.xml を探す
    const xmlEntry =
      zip.file('apple_health_export/export.xml') ??
      zip.file(/export\.xml$/i)[0];

    if (!xmlEntry) {
      throw new Error('ZIPファイル内にexport.xmlが見つかりませんでした');
    }
    return await xmlEntry.async('string');
  } else if (file.name.endsWith('.xml')) {
    return await file.text();
  } else {
    throw new Error('.zipまたは.xmlファイルを選択してください');
  }
}

// ─────────────────────────────────────────
// XML パース
// ─────────────────────────────────────────

function parseDate(str: string): Date {
  // Apple Health format: "2026-04-15 23:30:00 +0900"
  return new Date(str.replace(' ', 'T').replace(/(\+\d{2})(\d{2})$/, '$1:$2'));
}

function toDateStr(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function toTimeStr(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(11, 16);
}

/** 睡眠セグメントを「どの日の夜か」に振り分ける
 *  就寝が12:00〜23:59 → その日の夜
 *  就寝が00:00〜11:59 → 前日の夜
 */
function getSleepNightDate(start: Date): string {
  const jst = new Date(start.getTime() + 9 * 60 * 60 * 1000);
  const hour = jst.getUTCHours();
  if (hour < 12) {
    // 前日扱い
    const prev = new Date(jst);
    prev.setUTCDate(prev.getUTCDate() - 1);
    return prev.toISOString().slice(0, 10);
  }
  return jst.toISOString().slice(0, 10);
}

const SLEEP_ASLEEP_TYPES = new Set([
  'HKCategoryValueSleepAnalysisAsleep',
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
]);

const MENSTRUAL_FLOW_TYPES = new Set([
  'HKCategoryValueMenstrualFlowLight',
  'HKCategoryValueMenstrualFlowMedium',
  'HKCategoryValueMenstrualFlowHeavy',
  'HKCategoryValueMenstrualFlowUnspecified',
]);

export function parseAppleHealthXML(xmlText: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const dayMap = new Map<string, DayData>();

  const getDay = (dateStr: string): DayData => {
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, {
        sleepSegments: [],
        inBedSegments: [],
        hasMenstrualFlow: false,
      });
    }
    return dayMap.get(dateStr)!;
  };

  const records = doc.querySelectorAll('Record');

  records.forEach((record) => {
    const type = record.getAttribute('type') ?? '';
    const value = record.getAttribute('value') ?? '';
    const startStr = record.getAttribute('startDate');
    const endStr = record.getAttribute('endDate');

    if (!startStr || !endStr) return;

    // ── 睡眠データ ──
    if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const start = parseDate(startStr);
      const end = parseDate(endStr);
      const durationMin = (end.getTime() - start.getTime()) / 60000;

      // 極端に短い記録（1分未満）は無視
      if (durationMin < 1) return;

      const nightDate = getSleepNightDate(start);
      const day = getDay(nightDate);

      if (value === 'HKCategoryValueSleepAnalysisInBed') {
        day.inBedSegments.push({ start, end, isActualSleep: false });
      } else if (SLEEP_ASLEEP_TYPES.has(value)) {
        day.sleepSegments.push({ start, end, isActualSleep: true });
      }
    }

    // ── 生理データ ──
    if (
      type === 'HKCategoryTypeIdentifierMenstrualFlow' &&
      MENSTRUAL_FLOW_TYPES.has(value)
    ) {
      const start = parseDate(startStr);
      const dateStr = toDateStr(start);
      getDay(dateStr).hasMenstrualFlow = true;
    }
  });

  // ─────────────────────────────────────────
  // DayData → DailyLog に変換
  // ─────────────────────────────────────────

  const logs: Record<string, Partial<DailyLog>> = {};
  let sleepDays = 0;
  let menstrualDays = 0;
  let latestMenstrualDate: string | null = null;
  const allDates: string[] = [];

  // 直近90日のみ対象
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  dayMap.forEach((data, dateStr) => {
    const d = new Date(dateStr);
    if (d < cutoff) return;

    allDates.push(dateStr);
    const log: Partial<DailyLog> = { date: dateStr };

    // 睡眠時間の計算
    const segments = data.sleepSegments.length > 0
      ? data.sleepSegments
      : data.inBedSegments; // フォールバック

    if (segments.length > 0) {
      // 実際の睡眠時間（時間単位、0.5刻みに丸める）
      const totalMs = segments.reduce(
        (sum, s) => sum + (s.end.getTime() - s.start.getTime()),
        0
      );
      const totalHours = totalMs / 3600000;

      // 短すぎるものは無視（2時間未満はナップとみなさない）
      if (totalHours >= 2) {
        log.sleepHours = Math.round(totalHours * 2) / 2; // 0.5刻み
        sleepDays++;

        // 就寝時刻（最も早いセグメントの開始）
        const earliest = segments.reduce((a, b) =>
          a.start < b.start ? a : b
        );
        log.bedtime = toTimeStr(earliest.start);
      }
    }

    // 生理データ
    if (data.hasMenstrualFlow) {
      log.cyclePhase = 'menstruation' as CyclePhase;
      menstrualDays++;
      if (!latestMenstrualDate || dateStr > latestMenstrualDate) {
        latestMenstrualDate = dateStr;
      }
    }

    if (Object.keys(log).length > 1) {
      logs[dateStr] = log;
    }
  });

  // 生理開始日を推定（連続する生理期間の最初の日）
  let latestCycleStart: string | null = null;
  if (latestMenstrualDate) {
    // 最新の生理記録から遡って連続する最初の日を探す
    const sorted = Object.keys(logs)
      .filter((d) => logs[d].cyclePhase === 'menstruation')
      .sort();

    let firstDay = latestMenstrualDate;
    for (let i = sorted.length - 1; i > 0; i--) {
      const cur = new Date(sorted[i]);
      const prev = new Date(sorted[i - 1]);
      const diffDays = (cur.getTime() - prev.getTime()) / 86400000;
      if (diffDays <= 2) {
        firstDay = sorted[i - 1];
      } else {
        break;
      }
    }
    latestCycleStart = firstDay;
  }

  allDates.sort();
  const summary: ImportSummary = {
    totalDays: Object.keys(logs).length,
    sleepDays,
    menstrualDays,
    dateRange: {
      from: allDates[0] ?? '',
      to: allDates[allDates.length - 1] ?? '',
    },
    latestCycleStart,
  };

  return { logs, summary };
}
