import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useMotionEnabled } from '@/shared/model';

import { PixelIcon } from './pixel-icon';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TRAVEL = 4;
const DURATION = 1400;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Calm vertical motion; no flashing, spinning glow, or unapproved app icon. */
export const AnimatedIcon = () => {
  const theme = useTheme();
  const isMotionEnabled = useMotionEnabled();
  const offset = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(offset);
    offset.value = isMotionEnabled
      ? withRepeat(
          withTiming(-TRAVEL, {
            duration: DURATION,
            easing: Easing.inOut(Easing.quad),
          }),
          -1,
          true,
        )
      : 0;
    return () => cancelAnimation(offset);
  }, [isMotionEnabled, offset]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.bezel }]}>
      <View style={[styles.screen, { backgroundColor: theme.terminalScreen }]}>
        <Animated.View style={iconStyle}>
          <PixelIcon name="battery" size={72} tone="primary" />
        </Animated.View>
      </View>
      <View style={[styles.led, { backgroundColor: theme.primary }]} />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  led: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    top: 2,
    width: 40,
  },
  root: { borderRadius: 26, height: 128, padding: SPACING.two, width: 128 },
  screen: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
});
