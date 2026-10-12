import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../../App';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
}));

const SYM: Record<string, (a: number, b: number) => number> = {
  '＋': (a, b) => a + b,
  '－': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
};

function readAnswer(): number {
  const text = screen.getByTestId('question-text').props.children.join('');
  const m = text.match(/^(\d+) (.) (\d+) ＝ \?$/);
  if (!m) throw new Error(`式を読めません: ${text}`);
  return SYM[m[2]](Number(m[1]), Number(m[3]));
}

const press = (id: string) => fireEvent.press(screen.getByTestId(id));

/** 10問を、wrongIdx の問題だけまちがえて解く (選択肢モード) */
async function playChoice(wrongIdx: number[] = []) {
  for (let i = 0; i < 10; i++) {
    const ans = readAnswer();
    if (wrongIdx.includes(i)) {
      const wrongChoice = screen
        .getAllByRole('button')
        .map((b) => b.props.testID as string | undefined)
        .find((id) => id?.startsWith('choice-') && id !== `choice-${ans}`)!;
      press(wrongChoice);
      expect(screen.getByTestId('feedback-wrong')).toBeTruthy();
      expect(screen.getByTestId('correct-answer-text').props.children).toContain(`${ans}`);
    } else {
      press(`choice-${ans}`);
      expect(screen.getByTestId('feedback-correct')).toBeTruthy();
      expect(screen.getByTestId('celebration')).toBeTruthy(); // 正解アニメーション
    }
    press('next');
  }
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('画面 (iPhone 390x844 相当)', () => {
  test('ホーム画面に主要な項目がある', () => {
    render(<App seed={1} />);
    expect(screen.getByText('TOMORI MATH')).toBeTruthy();
    ['grade-3', 'grade-4', 'op-add', 'op-sub', 'op-mul', 'op-div', 'op-mix', 'level-easy', 'level-normal', 'level-challenge', 'mode-choice', 'mode-input', 'start'].forEach((id) =>
      expect(screen.getByTestId(id)).toBeTruthy(),
    );
  });

  test('選択肢モードで10問 → 集計 → 復習 → 履歴', async () => {
    render(<App seed={7} />);
    press('op-mul');
    press('start');
    expect(screen.getByTestId('counter').props.children.join('')).toBe('1 / 10');
    await playChoice([2, 6, 9]);

    await waitFor(() => expect(screen.getByTestId('score')).toBeTruthy());
    expect(screen.getByTestId('score').props.children.join('')).toContain('10問中 7問');
    expect(screen.getByTestId('wrong-list')).toBeTruthy();

    // 復習: まちがえた3問を、こんどは正解する
    press('review');
    expect(screen.getByTestId('counter').props.children.join('')).toBe('1 / 3');
    for (let i = 0; i < 3; i++) {
      press(`choice-${readAnswer()}`);
      press('next');
    }
    await waitFor(() => expect(screen.getByTestId('score').props.children.join('')).toContain('3問中 3問'));
    press('home');

    // 履歴が2件保存されている
    press('open-history');
    await waitFor(() => expect(screen.getByTestId('history-stats')).toBeTruthy());
    expect(screen.getByText('れんしゅう 2回')).toBeTruthy();
    const stored = JSON.parse((await AsyncStorage.getItem('tomori-math-007:history:v1'))!);
    expect(stored).toHaveLength(2);
    expect(stored[1]).toMatchObject({ total: 10, score: 7, isReview: false });
    expect(stored[0]).toMatchObject({ total: 3, score: 3, isReview: true });
  });

  test('数字入力モード (キーパッド)', async () => {
    render(<App seed={3} />);
    press('mode-input');
    press('op-add');
    press('start');
    const type = (n: number) => String(n).split('').forEach((d) => press(`key-${d}`));
    for (let i = 0; i < 10; i++) {
      expect(screen.getByTestId('submit').props.accessibilityState.disabled).toBe(true);
      type(readAnswer());
      press('submit');
      expect(screen.getByTestId('feedback-correct')).toBeTruthy();
      press('next');
    }
    await waitFor(() => expect(screen.getByTestId('score').props.children.join('')).toContain('10問中 10問'));
    expect(screen.getByText('ぜんぶ せいかい！')).toBeTruthy();
  });

  test('まちがえても責めない言葉で、正しい答えを出す', () => {
    render(<App seed={3} />);
    press('start');
    const ans = readAnswer();
    const other = screen.getAllByRole('button').map((b) => b.props.testID as string | undefined).find((id) => id?.startsWith('choice-') && id !== `choice-${ans}`)!;
    press(other);
    const body = screen.getByTestId('correct-answer-text').props.children as string;
    expect(body).toContain(`こたえは ${ans} だよ`);
    expect(body).not.toMatch(/ダメ|だめ|ちがう|まちがい|ざんねん/);
  });

  test('履歴は再読み込み(アプリ再起動)後も残り、そこから復習できる', async () => {
    const first = render(<App seed={11} />);
    press('op-sub');
    press('level-normal');
    press('start');
    await playChoice([0, 1]);
    await waitFor(() => expect(screen.getByTestId('score')).toBeTruthy());
    first.unmount();

    render(<App seed={12} />); // アプリを開き直す
    await waitFor(() => expect(screen.getByTestId('home-stats')).toBeTruthy());
    press('open-history');
    await waitFor(() => expect(screen.getByText('れんしゅう 1回')).toBeTruthy());
    expect(screen.getByText(/3年生 ・ ひき算 ・ ふつう/)).toBeTruthy();
    const stored = JSON.parse((await AsyncStorage.getItem('tomori-math-007:history:v1'))!);
    fireEvent.press(screen.getByLabelText(/8点/));
    press(`review-${stored[0].id}`);
    expect(screen.getByTestId('counter').props.children.join('')).toBe('1 / 2');
  });

  test('レベルを切り替えると、出る数の大きさが変わる', () => {
    const maxFor = (level: string) => {
      const { unmount } = render(<App seed={5} />);
      press('op-add');
      press(`level-${level}`);
      press('start');
      let m = 0;
      for (let i = 0; i < 10; i++) {
        m = Math.max(m, readAnswer());
        press(`choice-${readAnswer()}`);
        press('next');
      }
      unmount();
      return m;
    };
    const easy = maxFor('easy');
    const challenge = maxFor('challenge');
    expect(easy).toBeLessThanOrEqual(40);
    expect(challenge).toBeGreaterThan(200);
  });
});
