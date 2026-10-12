import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { Screen } from '../components/Screen';
import { computeStats } from '../logic/storage';
import { type HistoryRecord, LEVEL_LABEL, OPERATION_LABEL, OPERATION_SYMBOL } from '../logic/types';
import { colors } from '../theme';

interface Props {
  history: HistoryRecord[];
  onReview: (r: HistoryRecord) => void;
  onClear: () => void;
  onBack: () => void;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HistoryScreen({ history, onReview, onClear, onBack }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const stats = computeStats(history);

  return (
    <Screen>
      <Text style={styles.title} accessibilityRole="header">きろく</Text>
      {history.length === 0 ? (
        <Text style={styles.empty} testID="history-empty">まだ きろくが ないよ。まずは 1回 やってみよう！</Text>
      ) : (
        <>
          <View style={styles.statsBox} testID="history-stats">
            <Text style={styles.statsText}>れんしゅう {stats.plays}回</Text>
            <Text style={styles.statsText}>ぜんぶ せいかい {stats.perfects}回 ⭐</Text>
            <Text style={styles.statsText}>せいかい {stats.correct} / {stats.solved}問</Text>
          </View>
          {history.map((r) => {
            const open = openId === r.id;
            return (
              <View key={r.id} style={styles.card} testID={`history-${r.id}`}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDate(r.playedAt)} ${r.score}点`}
                  onPress={() => setOpenId(open ? null : r.id)}
                  style={styles.cardHead}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardDate}>{formatDate(r.playedAt)}</Text>
                    <Text style={styles.cardLabel}>
                      {r.grade}年生 ・ {OPERATION_LABEL[r.operation]} ・ {LEVEL_LABEL[r.level]}
                      {r.isReview ? ' ・ ふくしゅう' : ''}
                    </Text>
                  </View>
                  <Text style={styles.cardScore}>{r.score}/{r.total}</Text>
                </Pressable>
                {open &&
                  (r.wrong.length === 0 ? (
                    <Text style={styles.perfect}>ぜんぶ せいかい！ ⭐</Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {r.wrong.map((w, i) => (
                        <Text key={i} style={styles.wrongQ}>
                          {w.a} {OPERATION_SYMBOL[w.operation]} {w.b} ＝ {w.answer}
                        </Text>
                      ))}
                      <BigButton label="この もんだいを ふくしゅう" onPress={() => onReview(r)} testID={`review-${r.id}`} />
                    </View>
                  ))}
              </View>
            );
          })}
          {confirmClear ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.confirm}>きろくを ぜんぶ けしても いい？</Text>
              <BigButton label="けす" tone="secondary" onPress={() => { setConfirmClear(false); onClear(); }} testID="clear-yes" />
              <BigButton label="やめる" tone="ghost" onPress={() => setConfirmClear(false)} />
            </View>
          ) : (
            <BigButton label="きろくを けす" tone="ghost" onPress={() => setConfirmClear(true)} testID="clear" />
          )}
        </>
      )}
      <BigButton label="ホームへ" onPress={onBack} testID="history-back" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  empty: { fontSize: 20, fontWeight: '700', color: colors.sub, textAlign: 'center', paddingVertical: 24 },
  statsBox: { backgroundColor: colors.greenSoft, borderRadius: 20, padding: 14, gap: 4 },
  statsText: { fontSize: 20, fontWeight: '800', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 14, gap: 10, borderWidth: 3, borderColor: colors.line },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56 },
  cardDate: { fontSize: 16, color: colors.sub, fontWeight: '700' },
  cardLabel: { fontSize: 18, color: colors.ink, fontWeight: '800' },
  cardScore: { fontSize: 32, fontWeight: '900', color: colors.orange },
  wrongQ: { fontSize: 22, fontWeight: '800', color: colors.ink, backgroundColor: colors.yellowSoft, padding: 10, borderRadius: 12 },
  perfect: { fontSize: 20, fontWeight: '800', color: colors.green },
  confirm: { fontSize: 20, fontWeight: '800', color: colors.ink, textAlign: 'center' },
});
