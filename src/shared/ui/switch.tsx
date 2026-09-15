import { useEffect } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { HIT_SLOP_SIZE, RADII } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SwitchProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  isDisabled?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const KNOB = 24;
const PADDING = 3;
const TRACK_BORDER = 1;

/**
 * How far the knob travels. The border eats into the content box on both
 * sides, so leaving it out overshoots the track by 2px at the "on" end.
 */
const TRAVEL = TRACK_WIDTH - TRACK_BORDER * 2 - KNOB - PADDING * 2;
const DURATION = 160;

const EASING = Easing.out(Easing.quad);

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Switch = ({
  isChecked,
  onChange,
  isDisabled = false,
  label,
  style,
}: SwitchProps) => {
  const theme = useTheme();

  const progress = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isChecked ? 1 : 0, {
      duration: DURATION,
      easing: EASING,
    });
  }, [isChecked, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled: isDisabled }}
      accessibilityLabel={label}
      hitSlop={(HIT_SLOP_SIZE - TRACK_HEIGHT) / 2}
      disabled={isDisabled}
      onPress={() => onChange(!isChecked)}
      style={[
        styles.track,
        {
          backgroundColor: isChecked ? theme.primary : theme.surfaceDeep,
          borderColor: isChecked ? theme.primaryShadow : theme.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={[styles.knob, { backgroundColor: theme.surface }, knobStyle]}
      />
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  track: {
    borderRadius: RADII.pill,
    borderWidth: TRACK_BORDER,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: PADDING,
    width: TRACK_WIDTH,
  },
  knob: {
    borderRadius: RADII.pill,
    height: KNOB,
    width: KNOB,
  },
});

export type { SwitchProps };
