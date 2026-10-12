import { generateQuestionSet } from '../logic/generator';
import { achievementFor } from '../logic/feedback';
import {
  currentQuestion,
  isAnswered,
  isFinished,
  nextQuestion,
  reviewQuestions,
  startSession,
  submitAnswer,
  summarize,
} from '../logic/session';
import { type Session } from '../logic/session';

const play = (s: Session, wrongIdx: number[]): Session => {
  let cur = s;
  while (!isFinished(cur)) {
    const q = currentQuestion(cur)!;
    const wrong = wrongIdx.includes(cur.index);
    cur = submitAnswer(cur, wrong ? q.answer + 1 : q.answer);
    cur = nextQuestion(cur);
  }
  return cur;
};

describe('10問終了時の集計', () => {
  const qs = generateQuestionSet({ grade: 3, level: 'easy', operation: 'add' }, 42);

  test('全問正解', () => {
    const s = play(startSession(qs), []);
    expect(summarize(s.records)).toMatchObject({ total: 10, score: 10, wrong: [] });
    expect(achievementFor(10, 10).stars).toBe(3);
  });

  test('3問まちがい', () => {
    const s = play(startSession(qs), [1, 4, 8]);
    const sum = summarize(s.records);
    expect(sum.total).toBe(10);
    expect(sum.score).toBe(7);
    expect(sum.wrong.map((r) => r.question.id)).toEqual([qs[1].id, qs[4].id, qs[8].id]);
    expect(achievementFor(7, 10).stars).toBe(2);
  });

  test('全問まちがいでも前向きな表示', () => {
    const s = play(startSession(qs), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(summarize(s.records).score).toBe(0);
    const a = achievementFor(0, 10);
    expect(a.stars).toBe(0);
    expect(`${a.title}${a.message}`).not.toMatch(/ダメ|だめ|ざんねん|失敗/);
  });

  test('2回こたえても1回分しか記録しない / 答えずに進めない', () => {
    let s = startSession(qs);
    expect(nextQuestion(s)).toBe(s);
    s = submitAnswer(s, qs[0].answer);
    s = submitAnswer(s, qs[0].answer + 1);
    expect(s.records).toHaveLength(1);
    expect(s.records[0].correct).toBe(true);
    expect(isAnswered(s)).toBe(true);
  });
});

describe('間違えた問題の復習', () => {
  test('まちがえた問題だけで復習セットができ、全問正解で終わる', () => {
    const qs = generateQuestionSet({ grade: 4, level: 'normal', operation: 'mix' }, 8);
    const first = play(startSession(qs), [2, 5]);
    const review = reviewQuestions(summarize(first.records).wrong);
    expect(review).toHaveLength(2);
    expect(review.map((q) => q.answer)).toEqual([qs[2].answer, qs[5].answer]);
    expect(new Set(review.map((q) => q.id)).size).toBe(2);
    const done = play(startSession(review), []);
    expect(summarize(done.records)).toMatchObject({ total: 2, score: 2 });
  });
});
