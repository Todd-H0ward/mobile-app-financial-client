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

type SliderOrientation = 'horizontal' | 'vertical';

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
  /**
   * Horizontal is the default. Vertical grows upward: bottom is `min`,
   * top is `max` — the parent must give the control a height.
   */
  orientation?: SliderOrientation;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const THUMB_SIZE = 34;
const TRACK_THICKNESS = 14;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * A value slider.
 *
 * The thumb follows the finger on the UI thread; only the snapped value crosses
 * back to JS, so dragging never depends on how busy React is. Horizontal only
 * activates on sideways movement (so a scroll view keeps the scroll);
 * vertical only activates on up/down.
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
  orientation = 'horizontal',
  accessibilityLabel,
  style,
}: SliderProps) => {
  const theme = useTheme();
  const isVertical = orientation === 'vertical';
  const [length, setLength] = useState(0);

  // A zero-width range would divide by zero; it pins the thumb at the start.
  const span = max - min;
  const ratio = span > 0 ? clamp((value - min) / span, 0, 1) : 0;

  const offset = useSharedValue(0);
  const dragging = useSharedValue(0);

  const usable = Math.max(length - THUMB_SIZE, 1);

  /**
   * Horizontal: 0 at the left (= min). Vertical: 0 at the top of the
   * control, but min lives at the bottom — so the thumb offset is flipped.
   */
  const offsetFromValue = isVertical ? (1 - ratio) * usable : ratio * usable;

  const snap = (along: number) => {
    const progress = isVertical ? 1 - along / usable : along / usable;
    const next = min + span * progress;
    // Snapped relative to `min`, not to absolute multiples of `step`: with
    // `min = 5, step = 10` the reachable values are 5, 15, 25 — and `min`
    // itself stays reachable.
    return clamp(min + Math.round((next - min) / step) * step, min, max);
  };

  const commit = (along: number) => {
    const snapped = snap(along);
    if (snapped !== value) onChange(snapped);
  };

  const finish = (along: number) => {
    const snapped = snap(along);
    if (snapped !== value) onChange(snapped);
    onChangeEnd?.(snapped);
  };

  const stepBy = (delta: number) => {
    const snapped = clamp(value + delta, min, max);
    if (snapped === value) return;
    onChange(snapped);
    onChangeEnd?.(snapped);
  };

  // Horizontal yields to a vertical scroll; vertical yields to a sideways pan
  // so the room swipe still turns the scene when the finger starts next door.
  const base = Gesture.Pan();
  const oriented = isVertical
    ? base.activeOffsetY([-6, 6]).failOffsetX([-12, 12])
    : base.activeOffsetX([-6, 6]).failOffsetY([-12, 12]);

  const gesture = oriented
    // Deliberately not `.onBegin()`: that fires on touch-down, before the
    // gesture wins, so a tap or the first pixels of a vertical scroll would
    // commit a value the user never asked for.
    .onStart((event) => {
      'worklet';
      dragging.value = 1;
      const along = isVertical ? event.y : event.x;
      offset.value = clamp(along - THUMB_SIZE / 2, 0, usable);
      runOnJS(commit)(offset.value);
    })
    .onChange((event) => {
      'worklet';
      const along = isVertical ? event.y : event.x;
      offset.value = clamp(along - THUMB_SIZE / 2, 0, usable);
      runOnJS(commit)(offset.value);
    })
    .onFinalize(() => {
      'worklet';
      dragging.value = 0;
      if (onChangeEnd) {
        runOnJS(finish)(offset.value);
      }
    });

  const thumbStyle = useAnimatedStyle(() => {
    const along = dragging.value ? offset.value : offsetFromValue;
    return {
      // While idle the thumb follows the value; while dragging it follows the
      // finger, so it never lags a frame behind the touch.
      transform: [
        isVertical ? { translateY: along } : { translateX: along },
        { scale: dragging.value ? 1.1 : 1 },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
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
        style={[isVertical ? styles.rootVertical : styles.root, style]}
        onLayout={(event) => {
          const size = event.nativeEvent.layout;
          setLength(isVertical ? size.height : size.width);
        }}
      >
        <View
          style={[
            isVertical ? styles.trackColumn : styles.trackRow,
            isVertical
              ? { marginVertical: THUMB_SIZE / 2 }
              : { marginHorizontal: THUMB_SIZE / 2 },
          ]}
        >
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
              left: isVertical ? (HIT_SLOP_SIZE - THUMB_SIZE) / 2 : 0,
              top: isVertical ? 0 : (HIT_SLOP_SIZE - THUMB_SIZE) / 2,
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
  rootVertical: {
    alignItems: 'center',
    // Parent must set an explicit height — `%` overgrows absolute cards.
    width: HIT_SLOP_SIZE,
  },
  trackRow: {
    borderRadius: RADII.pill,
    flexDirection: 'row',
    height: TRACK_THICKNESS,
    overflow: 'hidden',
  },
  trackColumn: {
    borderRadius: RADII.pill,
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    width: TRACK_THICKNESS,
  },
  segment: {
    flex: 1,
  },
  thumb: {
    borderRadius: RADII.pill,
    borderWidth: 4,
    height: THUMB_SIZE,
    position: 'absolute',
    width: THUMB_SIZE,
  },
});

export type { SliderOrientation, SliderProps };
