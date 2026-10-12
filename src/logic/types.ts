export type Grade = 3 | 4;
export type Operation = 'add' | 'sub' | 'mul' | 'div';
/** 'mix' は4つの計算をまぜて出す */
export type OperationChoice = Operation | 'mix';
export type Level = 'easy' | 'normal' | 'challenge';
export type AnswerMode = 'choice' | 'input';

export const QUESTIONS_PER_SET = 10;

export interface Question {
  id: string;
  grade: Grade;
  level: Level;
  operation: Operation;
  a: number;
  b: number;
  /** 正しい答え (かならず1つの整数) */
  answer: number;
  /** 選択肢モード用。正解をふくむ4つ、重複なし */
  choices: number[];
}

export interface QuizSettings {
  grade: Grade;
  operation: OperationChoice;
  level: Level;
  answerMode: AnswerMode;
}

export interface AnswerRecord {
  question: Question;
  /** 入力された答え。未回答のときは null */
  given: number | null;
  correct: boolean;
}

export interface HistoryWrong {
  grade: Grade;
  level: Level;
  operation: Operation;
  a: number;
  b: number;
  answer: number;
  given: number | null;
}

export interface HistoryRecord {
  id: string;
  /** ISO 8601 */
  playedAt: string;
  grade: Grade;
  operation: OperationChoice;
  level: Level;
  total: number;
  score: number;
  isReview: boolean;
  wrong: HistoryWrong[];
}

export const OPERATION_LABEL: Record<OperationChoice, string> = {
  add: 'たし算',
  sub: 'ひき算',
  mul: 'かけ算',
  div: 'わり算',
  mix: 'ミックス',
};

export const OPERATION_SYMBOL: Record<Operation, string> = {
  add: '＋',
  sub: '－',
  mul: '×',
  div: '÷',
};

export const LEVEL_LABEL: Record<Level, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  challenge: 'チャレンジ',
};
