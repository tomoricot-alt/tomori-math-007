import { SPECS } from './ranges';
import type { Question } from './types';

/** 問題の異常値を検出する。空配列なら問題なし */
export function validateQuestion(q: Question): string[] {
  const errors: string[] = [];
  const { a, b, answer, operation } = q;
  for (const [name, v] of [['a', a], ['b', b], ['answer', answer]] as const) {
    if (!Number.isFinite(v)) errors.push(`${name}が数ではありません`);
    else if (!Number.isInteger(v)) errors.push(`${name}が整数ではありません`);
    else if (!Number.isSafeInteger(v)) errors.push(`${name}が大きすぎます`);
  }
  if (errors.length > 0) return errors;

  if (a < 0 || b < 0) errors.push('マイナスの数が含まれています');
  if (answer < 0) errors.push('答えがマイナスです');
  if (operation === 'div') {
    if (b === 0) errors.push('0でわっています');
    else if (a % b !== 0) errors.push('わり切れません');
  }
  if (operation === 'sub' && a < b) errors.push('ひかれる数が小さすぎます');

  const expected =
    operation === 'add' ? a + b : operation === 'sub' ? a - b : operation === 'mul' ? a * b : b !== 0 ? a / b : NaN;
  if (expected !== answer) errors.push(`答えが一致しません (正: ${expected}, 記録: ${answer})`);

  // 選択肢: 4つ・重複なし・正解がちょうど1つ・整数
  if (q.choices.length !== 4) errors.push('選択肢は4つにしてください');
  if (new Set(q.choices).size !== q.choices.length) errors.push('選択肢が重複しています');
  if (q.choices.filter((c) => c === answer).length !== 1) errors.push('正解の選択肢がちょうど1つではありません');
  if (q.choices.some((c) => !Number.isInteger(c) || c < 0)) errors.push('選択肢に不正な数があります');

  // 学年・段階の範囲チェック
  const spec = SPECS[q.grade][operation][q.level];
  if (operation === 'div') {
    if (b < spec.a.min || b > spec.a.max) errors.push('わる数が範囲外です');
    if (b !== 0 && (answer < spec.b.min || answer > spec.b.max)) errors.push('答えが範囲外です');
  } else if (operation === 'sub') {
    // ひき算は a,b を入れ替えることがあるので、全体の範囲で確認
    const lo = Math.min(spec.a.min, spec.b.min);
    const hi = Math.max(spec.a.max, spec.b.max) + 1;
    if (a < lo || a > hi || b < lo || b > hi) errors.push('数が範囲外です');
  } else if (a < spec.a.min || a > spec.a.max || b < spec.b.min || b > spec.b.max) {
    errors.push('数が範囲外です');
  }
  return errors;
}

/** 入力文字を整数に直す。数字だけ・9けたまで。それ以外は null */
export function parseAnswer(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,9}$/.test(t)) return null;
  return Number(t);
}

export const isCorrect = (q: Question, given: number | null): boolean =>
  given !== null && given === q.answer;
