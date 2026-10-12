import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font } from '../theme';

type Tone = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function BigButton({ label, onPress, tone = 'primary', disabled, testID, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === 'primary' && styles.primary,
        tone === 'secondary' && styles.secondary,
        tone === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, tone === 'primary' ? styles.textOnPrimary : styles.textDark]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 64,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.orange, borderBottomWidth: 5, borderBottomColor: colors.orangeDark },
  secondary: { backgroundColor: colors.blueSoft, borderBottomWidth: 5, borderBottomColor: '#B9D3FF' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.9 },
  text: { fontSize: font.button, fontWeight: '800' },
  textOnPrimary: { color: '#fff' },
  textDark: { color: colors.ink },
});
