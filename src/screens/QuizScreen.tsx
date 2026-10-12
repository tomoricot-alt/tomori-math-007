import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { Celebration } from '../components/Celebration';
import { Keypad } from '../components/Keypad';
import { Screen } from '../components/Screen';
import { correctMessage, wrongMessage } from '../logic/feedback';
import { createRng } from '../logic/rng';
import { currentQuestion, isAnswered, type Session } from '../logic/session';
import { type AnswerMode, OPERATION_SYMBOL } from '../logic/types';
import { parseAnswer } from '../logic/validate';
import { colors, font } from '../theme';

interface Props {
  session: Session;
  answerMode: AnswerMode;
  onAnswer: (given: number | null) => void;
  onNext: () => void;
  onQuit: () => void;
}

const MAX_DIGITS = 9;

export function QuizScreen({ session, answerMode, onAnswer, onNext, onQuit }: Props) {
  const q = currentQuestion(session);
  const answered = isAnswered(session);
  const record = answered ? session.records[session.index] : undefined;
  const [text, setText] = useState('');

  // 問題が変わったら入力をリセット
  useEffect(() => setText(''), [session.index]);

  const feedback = useMemo(() => {
    if (!record) return null;
    const rng = createRng(session.index * 7919 + record.question.answer);
    return record.correct
      ? { title: correctMessage(rng), body: '', ok: true }
      : { ...wrongMessage(rng, record.question.answer), ok: false };
  }, [record, session.index]);

  const submitText = () => {
    const n = parseAnswer(text);
    if (n !== null) onAnswer(n);
  };

  // PCではキーボードの数字・Backspace・Enterも使える
  useEffect(() => {
    if (Platform.OS !== 'web' || answerMode !== 'input') return;
    const handler = (e: KeyboardEvent) => {
      if (answered) {
        if (e.key === 'Enter') onNext();
        return;
      }
      if (/^\d$/.test(e.key)) setText((t) => (t.length < MAX_DIGITS ? t + e.key : t));
      else if (e.key === 'Backspace') setText((t) => t.slice(0, -1));
      else if (e.key === 'Enter') submitText();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerMode, answered, text, onNext]);

  if (!q) return null;
  const total = session.questions.length;
  const isLast = session.index === total - 1;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="やめる" onPress={onQuit} style={styles.quit} testID="quit">
          <Text style={styles.quitText}>← やめる</Text>
        </Pressable>
        <Text style={styles.counter} testID="counter" accessibilityLabel={`${session.index + 1}もんめ、ぜんぶで${total}もん`}>
          {session.index + 1} / {total}
        </Text>
      </View>
      <View style={styles.progressTrack} accessibilityRole="progressbar">
        <View style={[styles.progressFill, { width: `${(session.index / total) * 100}%` }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.question} testID="question-text" accessibilityLabel={`${q.a} ${OPERATION_SYMBOL[q.operation]} ${q.b} は？`}>
          {q.a} {OPERATION_SYMBOL[q.operation]} {q.b} ＝ ?
        </Text>
        {answerMode === 'input' && (
          <View style={styles.answerBox} testID="answer-box">
            <Text style={styles.answerText}>{record ? (record.given ?? '') : text || ' '}</Text>
          </View>
        )}
      </View>

      {feedback && record && (
        <View style={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackNg]} testID={feedback.ok ? 'feedback-correct' : 'feedback-wrong'}>
          {feedback.ok && <Celebration />}
          <Text style={styles.feedbackTitle}>{feedback.ok ? `⭕ ${feedback.title}` : `💡 ${feedback.title}`}</Text>
          {!feedback.ok && <Text style={styles.feedbackBody} testID="correct-answer-text">{feedback.body}</Text>}
        </View>
      )}

      {answered ? (
        <BigButton label={isLast ? 'けっかを見る' : 'つぎへ'} onPress={onNext} testID="next" />
      ) : answerMode === 'choice' ? (
        <View style={styles.choices}>
          {q.choices.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`${c}`}
              testID={`choice-${c}`}
              onPress={() => onAnswer(c)}
              style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
            >
              <Text style={styles.choiceText}>{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Keypad
            onDigit={(d) => setText((t) => (t.length < MAX_DIGITS ? t + d : t))}
            onBackspace={() => setText((t) => t.slice(0, -1))}
            onClear={() => setText('')}
          />
          <BigButton label="こたえる" onPress={submitText} disabled={parseAnswer(text) === null} testID="submit" />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quit: { minHeight: 44, justifyContent: 'center', paddingRight: 12 },
  quitText: { fontSize: 18, fontWeight: '800', color: colors.sub },
  counter: { fontSize: 24, fontWeight: '900', color: colors.purple },
  progressTrack: { height: 14, borderRadius: 7, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: 14, backgroundColor: colors.green, borderRadius: 7 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 16,
    borderWidth: 3,
    borderColor: colors.line,
  },
  question: { fontSize: font.question, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  answerBox: {
    minWidth: 180,
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  answerText: { fontSize: 40, fontWeight: '900', color: colors.blue },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  choice: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 84,
    borderRadius: 22,
    backgroundColor: colors.yellowSoft,
    borderWidth: 3,
    borderColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePressed: { backgroundColor: colors.yellow },
  choiceText: { fontSize: 34, fontWeight: '900', color: colors.ink },
  feedback: { borderRadius: 24, padding: 16, alignItems: 'center', gap: 6, overflow: 'hidden' },
  feedbackOk: { backgroundColor: colors.greenSoft },
  feedbackNg: { backgroundColor: colors.pinkSoft },
  feedbackTitle: { fontSize: 30, fontWeight: '900', color: colors.ink },
  feedbackBody: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
});
