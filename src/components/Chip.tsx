import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  flex?: boolean;
}

export function Chip({ label, selected, onPress, testID, flex = true }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={[styles.chip, flex && styles.flex, selected && styles.selected]}
    >
      <Text numberOfLines={1} style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 56,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flexGrow: 1, flexBasis: '30%' },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  text: { fontSize: 18, fontWeight: '700', color: colors.ink },
  textSelected: { color: colors.blue },
});
