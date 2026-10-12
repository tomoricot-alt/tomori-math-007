import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_KEY, MAX_HISTORY, addHistory, clearHistory, computeStats, loadHistory, sanitizeHistory } from '../logic/storage';
import type { HistoryRecord } from '../logic/types';

const rec = (n: number, over: Partial<HistoryRecord> = {}): HistoryRecord => ({
  id: `r${n}`,
  playedAt: new Date(2026, 0, 1, 10, n).toISOString(),
  grade: 3,
  operation: 'mul',
  level: 'normal',
  total: 10,
  score: 8,
  isReview: false,
  wrong: [
    { grade: 3, level: 'normal', operation: 'mul', a: 12, b: 3, answer: 36, given: 35 },
    { grade: 3, level: 'normal', operation: 'mul', a: 7, b: 8, answer: 56, given: null },
  ],
  ...over,
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('履歴保存と再読み込み', () => {
  test('保存して、読み直しても同じ', async () => {
    expect(await loadHistory()).toEqual([]);
    await addHistory(rec(1));
    await addHistory(rec(2, { score: 10, wrong: [] }));
    const loaded = await loadHistory();
    expect(loaded.map((r) => r.id)).toEqual(['r2', 'r1']); // 新しい順
    expect(loaded[1]).toEqual(rec(1));
  });

  test('保存データは端末内(AsyncStorage)だけで、JSONとして入っている', async () => {
    await addHistory(rec(1));
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  test('100件をこえたら古いものから消える', async () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) await addHistory(rec(i));
    const h = await loadHistory();
    expect(h).toHaveLength(MAX_HISTORY);
    expect(h[0].id).toBe(`r${MAX_HISTORY + 4}`);
  });

  test('こわれたデータでも落ちない', async () => {
    await AsyncStorage.setItem(HISTORY_KEY, '{not json');
    expect(await loadHistory()).toEqual([]);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({ a: 1 }));
    expect(await loadHistory()).toEqual([]);
    const mixed = [rec(1), { id: 'bad' }, null, rec(2, { score: 99 }), rec(3, { wrong: [{ a: 1, b: 0 }] as never })];
    const ok = sanitizeHistory(mixed);
    expect(ok.map((r) => r.id)).toEqual(['r1', 'r3']);
    expect(ok[1].wrong).toEqual([]);
  });

  test('消去', async () => {
    await addHistory(rec(1));
    await clearHistory();
    expect(await loadHistory()).toEqual([]);
  });

  test('集計', () => {
    const s = computeStats([rec(1), rec(2, { score: 10 })]);
    expect(s).toEqual({ plays: 2, solved: 20, correct: 18, perfects: 1, bestScore: 10 });
  });
});
