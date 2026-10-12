import { type Rng, createRng, pick, randInt, shuffle } from './rng';
import { SPECS, OPERATIONS } from './ranges';
import {
  type Grade,
  type Level,
  type Operation,
  type OperationChoice,
  type Question,
  type QuizSettings,
  QUESTIONS_PER_SET,
} from './types';
import { validateQuestion } from './validate';

export function computeAnswer(operation: Operation, a: number, b: number): number {
  switch (operation) {
    case 'add':
      return a + b;
    case 'sub':
      return a - b;
    case 'mul':
      return a * b;
    case 'div':
      if (b === 0) throw new Error('0でわることはできません');
      return a / b;
  }
}

/** 数だけ決める (選択肢は含まない) */
function pickOperands(
  rng: Rng,
  grade: Grade,
  level: Level,
  operation: Operation,
): { a: number; b: number } {
  const spec = SPECS[grade][operation][level];
  if (operation === 'div') {
    // わる数 × 答え = わられる数 にするので、かならず割り切れて0でわらない
    const divisor = randInt(rng, spec.a.min, spec.a.max);
    const quotient = randInt(rng, spec.b.min, spec.b.max);
    return { a: divisor * quotient, b: divisor };
  }
  let a = randInt(rng, spec.a.min, spec.a.max);
  let b = randInt(rng, spec.b.min, spec.b.max);
  if (operation === 'sub' && a < b) [a, b] = [b, a]; // 答えがマイナスにならないように
  if (operation === 'sub' && a === b) a += 1; // 答え0を避ける (やさしい練習のため)
  return { a, b };
}

/** 正解以外の、まぎらわしいけれど正解にならない数を3つ作る */
export function makeChoices(rng: Rng, answer: number): number[] {
  const set = new Set<number>([answer]);
  const mag = Math.max(1, 10 ** Math.floor(Math.log10(Math.max(answer, 1))));
  const offsets = [1, -1, 2, -2, 10, -10, mag, -mag, 5, -5, 3, -3, 100, -100];
  for (const off of shuffle(rng, offsets)) {
    if (set.size >= 4) break;
    const v = answer + off;
    if (v >= 0 && !set.has(v)) set.add(v);
  }
  // 念のため: たりなければ正解より大きい数でうめる
  let extra = 1;
  while (set.size < 4) {
    const v = answer + 20 + extra++;
    if (!set.has(v)) set.add(v);
  }
  return shuffle(rng, [...set]);
}

let idCounter = 0;

export function generateQuestion(
  rng: Rng,
  grade: Grade,
  level: Level,
  operation: Operation,
): Question {
  for (let attempt = 0; attempt < 50; attempt++) {
    const { a, b } = pickOperands(rng, grade, level, operation);
    const answer = computeAnswer(operation, a, b);
    const q: Question = {
      id: `q${++idCounter}`,
      grade,
      level,
      operation,
      a,
      b,
      answer,
      choices: makeChoices(rng, answer),
    };
    if (validateQuestion(q).length === 0) return q;
  }
  throw new Error('問題を作れませんでした');
}

/** 1回分(10問)を作る。同じ式は1回の中に2回出さない */
export function generateQuestionSet(
  settings: Pick<QuizSettings, 'grade' | 'level' | 'operation'>,
  seed: number,
  count: number = QUESTIONS_PER_SET,
): Question[] {
  const rng = createRng(seed);
  const questions: Question[] = [];
  const seen = new Set<string>();
  const ops = (c: OperationChoice): Operation[] => (c === 'mix' ? [...OPERATIONS] : [c]);
  let guard = 0;
  while (questions.length < count && guard++ < count * 100) {
    const choiceOps = ops(settings.operation);
    // ミックスのときは4種類を順番にまぜて、かたよらないようにする
    const op =
      settings.operation === 'mix'
        ? choiceOps[questions.length % choiceOps.length]
        : pick(rng, choiceOps);
    const q = generateQuestion(rng, settings.grade, settings.level, op);
    const key = `${q.operation}:${q.a}:${q.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(q);
  }
  if (questions.length < count) throw new Error('問題数がたりません');
  return mixOrder(rng, questions, settings.operation === 'mix');
}

function mixOrder(rng: Rng, qs: Question[], shouldShuffle: boolean): Question[] {
  return shouldShuffle ? shuffle(rng, qs) : qs;
}

/** 保存した「まちがえた問題」から、もう一度解ける問題を作る */
export function questionFromWrong(
  w: { grade: Grade; level: Level; operation: Operation; a: number; b: number; answer: number },
  seed: number,
  index: number,
): Question | null {
  const q: Question = {
    id: `h${index}-${seed}`,
    grade: w.grade,
    level: w.level,
    operation: w.operation,
    a: w.a,
    b: w.b,
    answer: w.answer,
    choices: makeChoices(createRng(seed + index), w.answer),
  };
  return validateQuestion(q).length === 0 ? q : null;
}
