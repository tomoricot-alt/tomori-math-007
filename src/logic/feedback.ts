import type { Rng } from './rng';
import { pick } from './rng';

const CORRECT = ['せいかい！', 'やったね！', 'すごい！', 'いいぞ！', 'ばっちり！', 'かんぺき！'];
const WRONG = ['おしい！', 'あと少し！', 'いい ちょうせん！', 'ナイストライ！'];
const WRONG_TAIL = ['つぎも いっしょに がんばろう！', 'ここで おぼえたら もう だいじょうぶ！', 'まちがえた ところが のびしろだよ！'];

export const correctMessage = (rng: Rng): string => pick(rng, CORRECT);

export const wrongMessage = (rng: Rng, answer: number): { title: string; body: string } => ({
  title: pick(rng, WRONG),
  body: `こたえは ${answer} だよ。${pick(rng, WRONG_TAIL)}`,
});

export interface Achievement {
  stars: 0 | 1 | 2 | 3;
  title: string;
  message: string;
  emoji: string;
}

/** 点数に応じた「達成状況」。どの点数でも前向きな言葉にする */
export function achievementFor(score: number, total: number): Achievement {
  const ratio = total === 0 ? 0 : score / total;
  if (score === total && total > 0)
    return { stars: 3, title: 'ぜんぶ せいかい！', message: 'パーフェクト！ きみは さんすうの スターだ！', emoji: '🏆' };
  if (ratio >= 0.7)
    return { stars: 2, title: 'とても よくできました！', message: 'もう少しで パーフェクト！ すばらしい！', emoji: '🌟' };
  if (ratio >= 0.4)
    return { stars: 1, title: 'よくがんばったね！', message: 'まちがえた もんだいを ふくしゅうして、もっと のばそう！', emoji: '😊' };
  return { stars: 0, title: 'ちょうせん できたね！', message: 'ふくしゅうすると、ぐんぐん できるようになるよ！', emoji: '🌱' };
}
