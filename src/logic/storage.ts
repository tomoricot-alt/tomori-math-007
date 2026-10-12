import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryRecord, HistoryWrong, Level, OperationChoice } from './types';

export const HISTORY_KEY = 'tomori-math-007:history:v1';
export const MAX_HISTORY = 100;

const LEVELS: Level[] = ['easy', 'normal', 'challenge'];
const OPS = ['add', 'sub', 'mul', 'div', 'mix'];

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

function sanitizeWrong(w: unknown): HistoryWrong | null {
  if (!w || typeof w !== 'object') return null;
  const o = w as Record<string, unknown>;
  if (
    (o.grade !== 3 && o.grade !== 4) ||
    !LEVELS.includes(o.level as Level) ||
    !['add', 'sub', 'mul', 'div'].includes(o.operation as string) ||
    !isInt(o.a) ||
    !isInt(o.b) ||
    !isInt(o.answer)
  )
    return null;
  if (o.operation === 'div' && o.b === 0) return null;
  return {
    grade: o.grade,
    level: o.level as Level,
    operation: o.operation as HistoryWrong['operation'],
    a: o.a,
    b: o.b,
    answer: o.answer,
    given: isInt(o.given) ? o.given : null,
  };
}

/** 保存データが壊れていても落ちないよう、1件ずつ確認して使えるものだけ返す */
export function sanitizeHistory(raw: unknown): HistoryRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.id !== 'string' ||
      typeof o.playedAt !== 'string' ||
      (o.grade !== 3 && o.grade !== 4) ||
      !OPS.includes(o.operation as string) ||
      !LEVELS.includes(o.level as Level) ||
      !isInt(o.total) ||
      !isInt(o.score) ||
      o.total < 0 ||
      o.score < 0 ||
      o.score > o.total
    )
      continue;
    const wrong = Array.isArray(o.wrong)
      ? o.wrong.map(sanitizeWrong).filter((w): w is HistoryWrong => w !== null)
      : [];
    out.push({
      id: o.id,
      playedAt: o.playedAt,
      grade: o.grade,
      operation: o.operation as OperationChoice,
      level: o.level as Level,
      total: o.total,
      score: o.score,
      isReview: o.isReview === true,
      wrong,
    });
  }
  return out;
}

/** 新しい順の履歴を読む。読めないときは空 */
export async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const text = await AsyncStorage.getItem(HISTORY_KEY);
    if (!text) return [];
    return sanitizeHistory(JSON.parse(text));
  } catch {
    return [];
  }
}

/** 1件を先頭に追加して保存し、保存後の履歴を返す。保存できなくても学習は続けられる */
export async function addHistory(record: HistoryRecord): Promise<HistoryRecord[]> {
  const current = await loadHistory();
  const next = [record, ...current.filter((r) => r.id !== record.id)].slice(0, MAX_HISTORY);
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // 保存に失敗しても画面は止めない
  }
  return next;
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export interface Stats {
  plays: number;
  solved: number;
  correct: number;
  perfects: number;
  bestScore: number;
}

export function computeStats(history: HistoryRecord[]): Stats {
  return {
    plays: history.length,
    solved: history.reduce((s, r) => s + r.total, 0),
    correct: history.reduce((s, r) => s + r.score, 0),
    perfects: history.filter((r) => r.total > 0 && r.score === r.total).length,
    bestScore: history.reduce((m, r) => Math.max(m, r.score), 0),
  };
}
