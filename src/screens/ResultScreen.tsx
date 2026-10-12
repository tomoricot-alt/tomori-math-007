import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { Screen } from '../components/Screen';
import { achievementFor } from '../logic/feedback';
import { summarize } from '../logic/session';
import { type AnswerRecord, OPERATION_SYMBOL } from '../logic/types';
import { colors, font } from '../theme';

interface Props {
  records: AnswerRecord[];
  isReview: boolean;
  onReview: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export function ResultScreen({ records, isReview, onReview, onRetry, onHome }: Props) {
  const { total, score, wrong } = summarize(records);
  const ach = achievementFor(score, total);
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.emoji}>{ach.emoji}</Text>
        <Text style={styles.stars} testID="stars" accessibilityLabel={`ほし ${ach.stars}こ`}>
          {'★'.repeat(ach.stars)}
          <Text style={styles.starOff}>{'★'.repeat(3 - ach.stars)}</Text>
        </Text>
        <Text style={styles.title}>{ach.title}</Text>
        <Text style={styles.score} testID="score">
          {total}問中 {score}問 せいかい
        </Text>
        <Text style={styles.message}>{ach.message}</Text>
      </View>

      {wrong.length > 0 ? (
        <View style={styles.wrongBox} testID="wrong-list">
          <Text style={styles.wrongTitle}>ふくしゅう しよう（{wrong.length}問）</Text>
          {wrong.map((r) => (
            <View key={r.question.id} style={styles.wrongRow}>
              <Text style={styles.wrongQ}>
                {r.question.a} {OPERATION_SYMBOL[r.question.operation]} {r.question.b} ＝ {r.question.answer}
              </Text>
              <Text style={styles.wrongNote}>{r.given === null ? 'こたえ' : `きみの こたえ: ${r.given}`}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.allClear}>ふくしゅうする もんだいは ないよ！</Text>
      )}

      {wrong.length > 0 && <BigButton label="まちがえた もんだいを やりなおす" onPress={onReview} testID="review" />}
      {!isReview && <BigButton label="もういちど 10問" tone={wrong.length > 0 ? 'secondary' : 'primary'} onPress={onRetry} testID="retry" />}
      <BigButton label="ホームへ" tone="secondary" onPress={onHome} testID="home" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6 },
  emoji: { fontSize: 64 },
  stars: { fontSize: 44, color: colors.yellow, letterSpacing: 4 },
  starOff: { color: colors.line },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  score: { fontSize: font.question - 14, fontWeight: '900', color: colors.orange },
  message: { fontSize: font.body, color: colors.sub, fontWeight: '700', textAlign: 'center' },
  wrongBox: { backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 10, borderWidth: 3, borderColor: colors.line },
  wrongTitle: { fontSize: 22, fontWeight: '900', color: colors.ink },
  wrongRow: { backgroundColor: colors.yellowSoft, borderRadius: 14, padding: 12 },
  wrongQ: { fontSize: 26, fontWeight: '900', color: colors.ink },
  wrongNote: { fontSize: 16, color: colors.sub, fontWeight: '700' },
  allClear: { fontSize: 22, fontWeight: '800', color: colors.green, textAlign: 'center' },
});
