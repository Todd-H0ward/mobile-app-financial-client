import { useEffect } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { RoomDirection } from '@/entities/room';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { BackIcon, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomDoorProps {
  /** Which edge the door sits on, and which way it takes the child. */
  direction: RoomDirection;
  /** The room behind it, already translated — "Кухня". */
  label: string;
  /** What a screen reader says: the whole sentence, not just the room. */
  accessibilityLabel: string;
  /** Draws attention once, right after the room opens for the first time. */
  isPulsing?: boolean;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the round part; hitSlop takes the target past 48dp. */
const DOOR_SIZE = 56;

/** How far down the screen the doors sit, as a share of its height. */
const DOOR_TOP = '55%';

const PULSE_SCALE = 1.12;
const PULSE_DURATION = 480;

/** Twice is an invitation; forever is a blinking banner. */
const PULSE_COUNT = 4;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The way out of a room: an arrow with the name of what is behind it.
 *
 * The name is not decoration — an arrow alone is an icon without a label, and
 * 3.6 asks for the word beside it. A child reads "Кухня", not "an arrow", and
 * that is the whole difference between knowing where you are going and poking
 * at the edge of the screen.
 *
 * A door is only ever drawn where a room actually is; the end of the map has
 * no greyed-out button, because nothing there can be pressed into working.
 */
export const RoomDoor = ({
  direction,
  label,
  accessibilityLabel,
  isPulsing = false,
  onPress,
}: RoomDoorProps) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isPulsing) return;

    // Started from the JS thread, as every animation in this app is.
    scale.value = withRepeat(
      withSequence(
        withTiming(PULSE_SCALE, {
          duration: PULSE_DURATION,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: PULSE_DURATION,
          easing: Easing.in(Easing.quad),
        }),
      ),
      PULSE_COUNT,
    );
  }, [isPulsing, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, direction === 'left' ? styles.left : styles.right]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlopFor(DOOR_SIZE)}
        onPress={onPress}
        style={({ pressed }) => [styles.press, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            pulseStyle,
          ]}
        >
          {/* One icon, mirrored: the chevron pointing the other way is the
              same drawing, and two icon files would drift apart. */}
          <View style={direction === 'right' ? styles.mirrored : undefined}>
            <BackIcon color={theme.text} size={28} />
          </View>
        </Animated.View>

        <View
          style={[
            styles.labelPlate,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text variant="smallBold" numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: DOOR_TOP,
  },
  circle: {
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    height: DOOR_SIZE,
    justifyContent: 'center',
    width: DOOR_SIZE,
  },
  labelPlate: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.two,
    paddingVertical: 2,
  },
  left: {
    left: SPACING.two,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  press: {
    alignItems: 'center',
    gap: SPACING.half,
  },
  right: {
    right: SPACING.two,
  },
});

export type { RoomDoorProps };
