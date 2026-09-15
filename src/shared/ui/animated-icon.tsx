import { useEffect } from 'react';

import { Image } from 'expo-image';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;

const DURATION = 600;
const GLOW_TURN_DURATION = 12 * 1000;
const ICON_SIZE = 128;
const GLOW_SIZE = 201;

const LOGO = {
  width: 76,
  height: 71,
};

// ═══════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════

const backgroundKeyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    easing: Easing.elastic(0.7),
    transform: [{ scale: 1 }],
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 1.3 }],
  },
  40: {
    easing: Easing.elastic(0.7),
    opacity: 0,
    transform: [{ scale: 1.3 }],
  },
  100: {
    easing: Easing.elastic(0.7),
    opacity: 1,
    transform: [{ scale: 1 }],
  },
});

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const AnimatedIcon = () => {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: GLOW_TURN_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${spin.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.glow, glowStyle]}>
        <Image
          style={styles.glow}
          source={require('@/assets/images/logo-glow.png')}
        />
      </Animated.View>

      <Animated.View
        entering={backgroundKeyframe.duration(DURATION)}
        style={styles.background}
      />

      <Animated.View
        style={styles.imageContainer}
        entering={logoKeyframe.duration(DURATION)}
      >
        <Image
          style={styles.image}
          source={require('@/assets/images/expo-logo.png')}
        />
      </Animated.View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    height: ICON_SIZE,
    justifyContent: 'center',
    width: ICON_SIZE,
    zIndex: 100,
  },
  glow: {
    height: GLOW_SIZE,
    position: 'absolute',
    width: GLOW_SIZE,
  },
  background: {
    borderRadius: ICON_SIZE / 3.2,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    height: ICON_SIZE,
    position: 'absolute',
    width: ICON_SIZE,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: LOGO.height,
    width: LOGO.width,
  },
});
