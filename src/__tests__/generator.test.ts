import { computeAnswer, generateQuestion, generateQuestionSet, makeChoices } from '../logic/generator';
import { createRng } from '../logic/rng';
import { OPERATIONS } from '../logic/ranges';
import { type Grade, type Level, type Question, QUESTIONS_PER_SET } from '../logic/types';
import { isCorrect, parseAnswer, validateQuestion } from '../logic/validate';

const GRADES: Grade[] = [3, 4];
const LEVELS: Level[] = ['easy', 'normal', 'challenge'];

describe('四則演算の正解判定', () => {
  test.each([
    ['add', 12, 7, 19],
    ['sub', 12, 7, 5],
    ['mul', 12, 7, 84],
    ['div', 84, 7, 12],
  ] as const)('%s %d,%d = %d', (op, a, b, ans) => {
    expect(computeAnswer(op, a, b)).toBe(ans);
    const q: Question = { id: 'x', grade: 3, level: 'normal', operation: op, a, b, answer: ans, choices: [ans, ans + 1, ans + 2, ans + 3] };
    expect(isCorrect(q, ans)).toBe(true);
    expect(isCorrect(q, ans + 1)).toBe(false);
    expect(isCorrect(q, null)).toBe(false);
  });

  test('0でわるとエラー', () => {
    expect(() => computeAnswer('div', 5, 0)).toThrow();
  });

  test('入力文字の変換: 正しい答えが不正解にならない', () => {
    expect(parseAnswer('42')).toBe(42);
    expect(parseAnswer(' 042 ')).toBe(42);
    expect(parseAnswer('0')).toBe(0);
    expect(parseAnswer('')).toBeNull();
    expect(parseAnswer('4a')).toBeNull();
    expect(parseAnswer('-3')).toBeNull();
    expect(parseAnswer('1.5')).toBeNull();
  });
});

describe('問題生成の異常値検出', () => {
  test('全学年×全計算×全レベルで、2000問ずつ異常がない', () => {
    const rng = createRng(12345);
    for (const g of GRADES)
      for (const op of OPERATIONS)
        for (const lv of LEVELS)
          for (let i = 0; i < 2000; i++) {
            const q = generateQuestion(rng, g, lv, op);
            expect(validateQuestion(q)).toEqual([]);
            if (op === 'div') {
              expect(q.b).not.toBe(0);
              expect(q.a % q.b).toBe(0);
            }
            if (op === 'sub') expect(q.answer).toBeGreaterThanOrEqual(0);
          }
  });

  test('選択肢は4つ・重複なし・正解がちょうど1つ', () => {
    const rng = createRng(1);
    for (let ans = 0; ans < 300; ans++) {
      const c = makeChoices(rng, ans);
      expect(c).toHaveLength(4);
      expect(new Set(c).size).toBe(4);
      expect(c.filter((x) => x === ans)).toHaveLength(1);
      expect(c.every((x) => x >= 0 && Number.isInteger(x))).toBe(true);
    }
  });

  test('異常な問題を検出できる', () => {
    const base: Question = { id: 'x', grade: 3, level: 'easy', operation: 'div', a: 12, b: 3, answer: 4, choices: [4, 5, 6, 7] };
    expect(validateQuestion(base)).toEqual([]);
    expect(validateQuestion({ ...base, b: 0 }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, a: 13, answer: 13 / 3 }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, answer: 5 }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, choices: [4, 4, 6, 7] }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, choices: [5, 6, 7, 8] }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, a: NaN }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, operation: 'sub', a: 3, b: 12, answer: -9 }).length).toBeGreaterThan(0);
  });

  test('1回分は10問で、同じ式がない', () => {
    for (const g of GRADES)
      for (const lv of LEVELS)
        for (const op of ['add', 'sub', 'mul', 'div', 'mix'] as const) {
          const set = generateQuestionSet({ grade: g, level: lv, operation: op }, 777);
          expect(set).toHaveLength(QUESTIONS_PER_SET);
          expect(new Set(set.map((q) => `${q.operation}:${q.a}:${q.b}`)).size).toBe(QUESTIONS_PER_SET);
          set.forEach((q) => expect(validateQuestion(q)).toEqual([]));
        }
  });

  test('ミックスは4つの計算がすべて出る', () => {
    const set = generateQuestionSet({ grade: 4, level: 'normal', operation: 'mix' }, 5);
    expect(new Set(set.map((q) => q.operation)).size).toBe(4);
  });

  test('同じseedなら同じ問題', () => {
    const s = { grade: 3 as Grade, level: 'normal' as Level, operation: 'mul' as const };
    const key = (qs: Question[]) => qs.map((q) => `${q.a}x${q.b}`).join(',');
    expect(key(generateQuestionSet(s, 9))).toBe(key(generateQuestionSet(s, 9)));
  });
});

describe('難易度の切り替え', () => {
  const max = (g: Grade, lv: Level, op: 'add' | 'mul') => {
    const rng = createRng(99);
    let m = 0;
    for (let i = 0; i < 500; i++) m = Math.max(m, generateQuestion(rng, g, lv, op).answer);
    return m;
  };
  test.each(GRADES)('%d年生: やさしい < ふつう < チャレンジ の順に数が大きくなる', (g) => {
    for (const op of ['add', 'mul'] as const) {
      expect(max(g, 'easy', op)).toBeLessThan(max(g, 'normal', op));
      expect(max(g, 'normal', op)).toBeLessThan(max(g, 'challenge', op));
    }
  });
  test('4年生は3年生より大きい数をあつかう', () => {
    expect(max(4, 'normal', 'add')).toBeGreaterThan(max(3, 'normal', 'add'));
  });
  test('生成した問題が選んだ学年・レベルになっている', () => {
    const set = generateQuestionSet({ grade: 4, level: 'challenge', operation: 'div' }, 3);
    set.forEach((q) => {
      expect(q.grade).toBe(4);
      expect(q.level).toBe('challenge');
    });
  });
});
