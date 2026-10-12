import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { Chip } from '../components/Chip';
import { Screen } from '../components/Screen';
import { computeStats } from '../logic/storage';
import {
  type AnswerMode,
  type Grade,
  type HistoryRecord,
  type Level,
  type OperationChoice,
  type QuizSettings,
  LEVEL_LABEL,
  OPERATION_LABEL,
} from '../logic/types';
import { colors, font } from '../theme';

interface Props {
  settings: QuizSettings;
  onChange: (s: QuizSettings) => void;
  onStart: () => void;
  onHistory: () => void;
  history: HistoryRecord[];
}

const OPS: OperationChoice[] = ['add', 'sub', 'mul', 'div', 'mix'];
const LEVELS: Level[] = ['easy', 'normal', 'challenge'];
const GRADES: Grade[] = [3, 4];
const MODES: { value: AnswerMode; label: string }[] = [
  { value: 'choice', label: 'えらぶ' },
  { value: 'input', label: '数字を入れる' },
];

export function HomeScreen({ settings, onChange, onStart, onHistory, history }: Props) {
  const stats = computeStats(history);
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.logo}>➕➖✖️➗</Text>
        <Text style={styles.title} accessibilityRole="header">TOMORI MATH</Text>
        <Text style={styles.lead}>10もん れんしゅう しよう！</Text>
      </View>

      <Section title="学年">
        <View style={styles.row}>
          {GRADES.map((g) => (
            <Chip key={g} label={`${g}年生`} selected={settings.grade === g} onPress={() => onChange({ ...settings, grade: g })} testID={`grade-${g}`} />
          ))}
        </View>
      </Section>

      <Section title="けいさん">
        <View style={styles.row}>
          {OPS.map((o) => (
            <Chip key={o} label={OPERATION_LABEL[o]} selected={settings.operation === o} onPress={() => onChange({ ...settings, operation: o })} testID={`op-${o}`} />
          ))}
        </View>
      </Section>

      <Section title="レベル">
        <View style={styles.row}>
          {LEVELS.map((l) => (
            <Chip key={l} label={LEVEL_LABEL[l]} selected={settings.level === l} onPress={() => onChange({ ...settings, level: l })} testID={`level-${l}`} />
          ))}
        </View>
      </Section>

      <Section title="こたえかた">
        <View style={styles.row}>
          {MODES.map((m) => (
            <Chip key={m.value} label={m.label} selected={settings.answerMode === m.value} onPress={() => onChange({ ...settings, answerMode: m.value })} testID={`mode-${m.value}`} />
          ))}
        </View>
      </Section>

      <BigButton label="スタート！" onPress={onStart} testID="start" />
      <BigButton label="きろくを見る" tone="secondary" onPress={onHistory} testID="open-history" />

      {stats.plays > 0 && (
        <Text style={styles.stats} testID="home-stats">
          これまで {stats.plays}回 れんしゅう ・ ぜんぶ せいかい {stats.perfects}回 ⭐
        </Text>
      )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  logo: { fontSize: 32 },
  title: { fontSize: font.title, fontWeight: '900', color: colors.orange, letterSpacing: 1 },
  lead: { fontSize: font.body, color: colors.sub, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stats: { textAlign: 'center', color: colors.sub, fontSize: 16, fontWeight: '700' },
});
