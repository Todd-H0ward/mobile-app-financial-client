import { useState } from 'react';

import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const DURATION = 600;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const SplashOverlay = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
    20: {
      opacity: 1,
    },
    70: {
      easing: Easing.elastic(0.7),
      opacity: 0,
    },
    100: {
      easing: Easing.elastic(0.7),
      opacity: 0,
      transform: [{ scale: 1 }],
    },
  });

  const image = (
    <Image
      style={styles.image}
      source={require('@/assets/images/expo-logo.png')}
    />
  );

  return isAnimating ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setIsVisible, false);
        }
      })}
      style={styles.root}
    >
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => {
            setIsAnimating(true);
          });
      }}
      style={styles.root}
    >
      {image}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    zIndex: 1000,
  },
  image: {
    height: 71,
    width: 76,
  },
});
