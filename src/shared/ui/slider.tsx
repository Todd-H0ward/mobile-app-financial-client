import { useState } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { HIT_SLOP_SIZE, RADII, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { clamp } from '../utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /**
   * Fires once when the finger lifts (or a screen-reader step lands).
   * Use this to persist — calling a store write from `onChange` while
   * dragging freezes the thumb behind SQLite.
   */
  onChangeEnd?: (value: number) => void;
  /** Colours of the track, from the low end to the high end. */
  track?: [string, string, string];
  color?: ThemeColor;
  /**
   * Fills the thumb with `color` instead of a white disc — use on soft
   * tinted surfaces where a hairline border disappears.
   */
  isThumbFilled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const THUMB_SIZE = 34;
const TRACK_HEIGHT = 14;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * A value slider.
 *
 * The thumb follows the finger on the UI thread; only the snapped value crosses
 * back to JS, so dragging never depends on how busy React is. The gesture only
 * activates on horizontal movement, so a slider inside a scroll view does not
 * steal the scroll.
 */
export const Slider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  onChangeEnd,
  track,
  color = 'primary',
  isThumbFilled = false,
  style,
}: SliderProps) => {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  // A zero-width range would divide by zero; it pins the thumb at the start.
  const span = max - min;
  const ratio = span > 0 ? clamp((value - min) / span, 0, 1) : 0;

  const offset = useSharedValue(0);
  const dragging = useSharedValue(0);

  const usable = Math.max(width - THUMB_SIZE, 1);

  const snap = (x: number) => {
    const next = min + (span * x) / usable;
    // Snapped relative to `min`, not to absolute multiples of `step`: with
    // `min = 5, step = 10` the reachable values are 5, 15, 25 — and `min`
    // itself stays reachable.
    return clamp(min + Math.round((next - min) / step) * step, min, max);
  };

  const commit = (x: number) => {
    const snapped = snap(x);
    if (snapped !== value) onChange(snapped);
  };

  const finish = (x: number) => {
    const snapped = snap(x);
    if (snapped !== value) onChange(snapped);
    onChangeEnd?.(snapped);
  };

  const stepBy = (delta: number) => {
    const snapped = clamp(value + delta, min, max);
    if (snapped === value) return;
    onChange(snapped);
    onChangeEnd?.(snapped);
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    // Deliberately not `.onBegin()`: that fires on touch-down, before the
    // gesture wins, so a tap or the first pixels of a vertical scroll would
    // commit a value the user never asked for.
    .onStart((event) => {
      dragging.value = 1;
      offset.value = clamp(event.x - THUMB_SIZE / 2, 0, usable);
      runOnJS(commit)(offset.value);
    })
    .onChange((event) => {
      offset.value = clamp(event.x - THUMB_SIZE / 2, 0, usable);
      runOnJS(commit)(offset.value);
    })
    .onFinalize(() => {
      dragging.value = 0;
      if (onChangeEnd) {
        runOnJS(finish)(offset.value);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    // While idle the thumb follows the value; while dragging it follows the
    // finger, so it never lags a frame behind the touch.
    transform: [
      { translateX: dragging.value ? offset.value : ratio * usable },
      { scale: dragging.value ? 1.1 : 1 },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          // Screen-reader users step the slider instead of dragging it.
          if (event.nativeEvent.actionName === 'increment') {
            stepBy(step);
          }

          if (event.nativeEvent.actionName === 'decrement') {
            stepBy(-step);
          }
        }}
        style={[styles.root, style]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.trackRow}>
          {(
            track ?? [theme.primarySoft, theme.surfaceDeep, theme.accentSoft]
          ).map((segment, index) => (
            <View
              key={index}
              style={[styles.segment, { backgroundColor: segment }]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: isThumbFilled ? theme[color] : theme.surface,
              borderColor: theme[color],
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    // Thumb is 34dp; the gesture area is 48dp so the track is still reachable.
    height: HIT_SLOP_SIZE,
    justifyContent: 'center',
    width: '100%',
  },
  trackRow: {
    borderRadius: RADII.pill,
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    marginHorizontal: THUMB_SIZE / 2,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
  },
  thumb: {
    borderRadius: RADII.pill,
    borderWidth: 4,
    height: THUMB_SIZE,
    left: 0,
    position: 'absolute',
    width: THUMB_SIZE,
  },
});

export type { SliderProps };
