import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { generateQuestionSet, questionFromWrong } from './src/logic/generator';
import { randomSeed } from './src/logic/rng';
import {
  type Session,
  isFinished,
  nextQuestion,
  reviewQuestions,
  startSession,
  submitAnswer,
  summarize,
} from './src/logic/session';
import { addHistory, clearHistory, loadHistory } from './src/logic/storage';
import type { HistoryRecord, HistoryWrong, Question, QuizSettings } from './src/logic/types';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { colors } from './src/theme';

type View_ = 'home' | 'quiz' | 'result' | 'history';

interface Props {
  /** テスト用: 問題の乱数seedを固定する */
  seed?: number;
}

export default function App({ seed }: Props) {
  const [view, setView] = useState<View_>('home');
  const [settings, setSettings] = useState<QuizSettings>({
    grade: 3,
    operation: 'add',
    level: 'easy',
    answerMode: 'choice',
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isReview, setIsReview] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    let alive = true;
    loadHistory().then((h) => alive && setHistory(h));
    return () => {
      alive = false;
    };
  }, []);

  const begin = useCallback((questions: Question[], review: boolean) => {
    setSession(startSession(questions));
    setIsReview(review);
    setView('quiz');
  }, []);

  const start = () => begin(generateQuestionSet(settings, seed ?? randomSeed()), false);

  const finish = async (s: Session) => {
    const { total, score, wrong } = summarize(s.records);
    // ふくしゅうのときも正しい学年・計算で残せるよう、問題そのものから決める
    const first = s.questions[0];
    const ops = new Set(s.questions.map((q) => q.operation));
    const record: HistoryRecord = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      playedAt: new Date().toISOString(),
      grade: first.grade,
      operation: ops.size === 1 ? first.operation : 'mix',
      level: first.level,
      total,
      score,
      isReview,
      wrong: wrong.map((r) => ({
        grade: r.question.grade,
        level: r.question.level,
        operation: r.question.operation,
        a: r.question.a,
        b: r.question.b,
        answer: r.question.answer,
        given: r.given,
      })),
    };
    setView('result');
    setHistory(await addHistory(record));
  };

  const onNext = () => {
    if (!session) return;
    const next = nextQuestion(session);
    setSession(next);
    if (isFinished(next)) void finish(next);
  };

  const reviewFromHistory = (r: HistoryRecord) => {
    const s = seed ?? randomSeed();
    const qs = r.wrong
      .map((w: HistoryWrong, i) => questionFromWrong(w, s, i))
      .filter((q): q is Question => q !== null);
    if (qs.length > 0) begin(qs, true);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {view === 'home' && (
        <HomeScreen settings={settings} onChange={setSettings} onStart={start} onHistory={() => setView('history')} history={history} />
      )}
      {view === 'quiz' && session && !isFinished(session) && (
        <QuizScreen
          session={session}
          answerMode={settings.answerMode}
          onAnswer={(g) => setSession((s) => (s ? submitAnswer(s, g) : s))}
          onNext={onNext}
          onQuit={() => setView('home')}
        />
      )}
      {view === 'result' && session && (
        <ResultScreen
          records={session.records}
          isReview={isReview}
          onReview={() => begin(reviewQuestions(summarize(session.records).wrong), true)}
          onRetry={start}
          onHome={() => setView('home')}
        />
      )}
      {view === 'history' && (
        <HistoryScreen
          history={history}
          onReview={reviewFromHistory}
          onClear={async () => {
            await clearHistory();
            setHistory([]);
          }}
          onBack={() => setView('home')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
