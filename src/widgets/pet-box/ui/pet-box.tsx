import { useEffect } from 'react';

import { Image } from 'expo-image';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useIsMotionEnabled } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetBoxProps {
  onPress: () => void;
  /** Side of the box art, in design points. */
  size?: number;
  /** Caption under the box. The box alone would not say it may be tapped. */
  label?: string;
  /**
   * Draws attention once after onboarding — the child just named themselves
   * and the box is the next thing to open.
   */
  isPulsing?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Cartoon pet carrier — team art with air holes and a peeking paw.
 * See docs/licenses.md.
 */
const BOX_SOURCE = require('@/assets/images/props/pet-box.png');

const DEFAULT_SIZE = 196;

/** How far the carton rocks, in degrees. Small: something stirs, nothing bangs. */
const ROCK_ANGLE = 2.2;

const ROCK_DURATION = 900;

/** Quiet between two rocks, so the box is not shaking non-stop. */
const ROCK_REST = 2600;

/** How far it sinks under a finger. */
const PRESS_SCALE = 0.96;

const PRESS_DURATION = 90;

const PULSE_SCALE = 1.06;
const PULSE_DURATION = 420;
/** A few beats, then the rock alone keeps the box alive. */
const PULSE_COUNT = 3;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The carrier the pet arrives in: a sealed cardboard parcel that rocks now
 * and then because something inside is alive.
 *
 * Drawn as team art (holes + a peeking paw) so it reads next to the room
 * paintings — the old SVG carton looked like a placeholder.
 */
export const PetBox = ({
  onPress,
  size = DEFAULT_SIZE,
  label,
  isPulsing = false,
  style,
}: PetBoxProps) => {
  const { t } = useTranslation();
  const boxLabel = label ?? t('home.petBoxLabel');

  const isMotionEnabled = useIsMotionEnabled();

  const rock = useSharedValue(0);
  const press = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isMotionEnabled) {
      rock.value = 0;
      return;
    }

    rock.value = withRepeat(
      withSequence(
        withTiming(-1, {
          duration: ROCK_DURATION,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: ROCK_DURATION,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: ROCK_DURATION,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, { duration: ROCK_REST }),
      ),
      -1,
    );
  }, [isMotionEnabled, rock]);

  useEffect(() => {
    if (!isPulsing || !isMotionEnabled) {
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
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
  }, [isMotionEnabled, isPulsing, pulse]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rock.value * ROCK_ANGLE}deg` },
      { scale: press.value * pulse.value },
    ],
  }));

  return (
    <View style={[styles.root, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={boxLabel}
        onPressIn={() => {
          press.value = withTiming(PRESS_SCALE, { duration: PRESS_DURATION });
        }}
        onPressOut={() => {
          press.value = withTiming(1, { duration: PRESS_DURATION });
        }}
        onPress={onPress}
      >
        <Animated.View
          style={[
            {
              height: size,
              width: size,
              transformOrigin: [size / 2, size, 0],
            },
            boxStyle,
          ]}
        >
          <Image
            source={BOX_SOURCE}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </Pressable>

      <Text variant="smallBold" themeColor="textSecondary" style={styles.label}>
        {boxLabel}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
  },
  label: {
    textAlign: 'center',
  },
  root: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: SPACING.two,
  },
});

export type { PetBoxProps };
