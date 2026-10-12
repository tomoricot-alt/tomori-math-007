import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

const PARTICLES = ['⭐', '🎉', '✨', '🌟', '🎈', '💖', '⭐', '🎉', '✨', '🌟'];

/** 正解のときに、星やくす玉がふわっと広がるアニメーション */
export function Celebration() {
  const progress = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const native = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
      Animated.sequence([
        Animated.spring(pop, { toValue: 1, friction: 3, tension: 120, useNativeDriver: native }),
      ]),
    ]).start();
  }, [progress, pop]);

  return (
    <View style={styles.wrap} pointerEvents="none" testID="celebration">
      {PARTICLES.map((emoji, i) => {
        const angle = (i / PARTICLES.length) * Math.PI * 2;
        const dist = 90 + (i % 3) * 30;
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] });
        const opacity = progress.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.Text key={i} style={[styles.particle, { opacity, transform: [{ translateX }, { translateY }] }]}>
            {emoji}
          </Animated.Text>
        );
      })}
      <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }] }}>
        <Text style={styles.big}>🎉</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 90, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', fontSize: 30 },
  big: { fontSize: 64 },
});
