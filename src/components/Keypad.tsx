import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const ROWS = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']];

export function Keypad({ onDigit, onBackspace, onClear, disabled }: Props) {
  const key = (label: string, onPress: () => void, tone: 'num' | 'sub' = 'num', a11y?: string) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      testID={`key-${a11y ?? label}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.key, tone === 'sub' && styles.keySub, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.pad}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((d) => key(d, () => onDigit(d)))}
        </View>
      ))}
      <View style={styles.row}>
        {key('消す', onClear, 'sub', 'clear')}
        {key('0', () => onDigit('0'))}
        {key('⌫', onBackspace, 'sub', 'backspace')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySub: { backgroundColor: colors.yellowSoft },
  keyText: { fontSize: 28, fontWeight: '800', color: colors.ink },
  pressed: { backgroundColor: colors.blueSoft },
  disabled: { opacity: 0.5 },
});
