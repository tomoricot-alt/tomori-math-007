import type { AnswerRecord, Question } from './types';
import { isCorrect } from './validate';

export interface Session {
  questions: Question[];
  /** いま出している問題の番号 (0はじまり) */
  index: number;
  records: AnswerRecord[];
}

export const startSession = (questions: Question[]): Session => ({ questions, index: 0, records: [] });

export const currentQuestion = (s: Session): Question | undefined => s.questions[s.index];

/** 答えを記録する。同じ問題に2回記録はできない (連打対策) */
export function submitAnswer(s: Session, given: number | null): Session {
  const q = currentQuestion(s);
  if (!q || s.records.length > s.index) return s;
  const record: AnswerRecord = { question: q, given, correct: isCorrect(q, given) };
  return { ...s, records: [...s.records, record] };
}

/** 回答ずみなら次の問題へ。最後の問題なら index が問題数と同じになる */
export function nextQuestion(s: Session): Session {
  if (s.records.length <= s.index) return s;
  return { ...s, index: s.index + 1 };
}

export const isFinished = (s: Session): boolean => s.index >= s.questions.length;

export const isAnswered = (s: Session): boolean => s.records.length > s.index;

export interface Summary {
  total: number;
  score: number;
  wrong: AnswerRecord[];
}

export function summarize(records: AnswerRecord[]): Summary {
  const wrong = records.filter((r) => !r.correct);
  return { total: records.length, score: records.length - wrong.length, wrong };
}

/** まちがえた問題だけでもう一度解く用の問題セット (選択肢は同じものを使う) */
export const reviewQuestions = (wrong: AnswerRecord[]): Question[] =>
  wrong.map((r, i) => ({ ...r.question, id: `${r.question.id}-r${i}` }));
