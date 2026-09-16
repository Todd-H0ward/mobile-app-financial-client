import { useEffect } from 'react';

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
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { useUserStore } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetBoxProps {
  /** Opens whatever comes next — the meeting screen. */
  onPress: () => void;
  /** Side of the box, in design points. */
  size?: number;
  /** Caption under the box. The box alone would not say it may be tapped. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Drawing box of the carton. Fractions below are of these units. */
const VIEW_BOX = 100;

const DEFAULT_SIZE = 180;

/** How far the carton rocks, in degrees. Small: something stirs, nothing bangs. */
const ROCK_ANGLE = 2.5;

/** One way of the rock. */
const ROCK_DURATION = 900;

/** Quiet between two rocks, so the box is not shaking non-stop. */
const ROCK_REST = 2600;

/** How far it sinks under a finger. */
const PRESS_SCALE = 0.96;

const PRESS_DURATION = 90;

/** Air holes: two rows of four, spaced across the front panel. */
const HOLE_COLUMNS = [34, 46, 58, 70];
const HOLE_ROWS = [58, 70];
const HOLE_RADIUS = 3.2;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The carrier the pet arrives in: a cardboard carton with a handle slot and
 * air holes, rocking now and then because something inside is alive.
 *
 * Drawn rather than shipped as an asset. docs/licenses.md keeps pet art as a
 * blocker until a licence is verified, and a carton made of five shapes costs
 * nothing to draw and nothing to clear.
 */
export const PetBox = ({
  onPress,
  size = DEFAULT_SIZE,
  label = 'Кто-то скребётся внутри. Нажми',
  style,
}: PetBoxProps) => {
  const theme = useTheme();

  // There is no profile during onboarding, and the grown-up's switch is the
  // authority once there is one — 3.6, weak devices.
  const isAnimationEnabled = useUserStore(
    (state) => state.user?.settings.isAnimationEnabled ?? true,
  );

  const rock = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (!isAnimationEnabled) {
      rock.value = 0;
      return;
    }

    // Started from the JS thread, as every animation in this app is.
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
  }, [isAnimationEnabled, rock]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rock.value * ROCK_ANGLE}deg` },
      { scale: press.value },
    ],
  }));

  return (
    <View style={[styles.root, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
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
            { height: size, width: size, transformOrigin: [size / 2, size, 0] },
            boxStyle,
          ]}
        >
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
          >
            {/* The floor the carton stands on. */}
            <Ellipse cx={50} cy={92} rx={36} ry={5} fill={theme.overlay} />

            {/* Lid flaps, folded open and leaning back. */}
            <Path
              d="M 14 34 L 30 20 L 52 26 L 50 38 Z"
              fill={theme.accent}
              stroke={theme.accentStrong}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path
              d="M 86 34 L 70 20 L 48 26 L 50 38 Z"
              fill={theme.accent}
              stroke={theme.accentStrong}
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Front panel. */}
            <Rect
              x={14}
              y={34}
              width={72}
              height={54}
              rx={4}
              fill={theme.accentSoft}
              stroke={theme.accentStrong}
              strokeWidth={2}
            />

            {/* The side, a shade darker, so the carton has a corner. */}
            <Path
              d="M 14 34 L 26 34 L 26 88 L 14 88 Z"
              fill={theme.accent}
              stroke={theme.accentStrong}
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Handle slot. */}
            <Rect
              x={40}
              y={41}
              width={20}
              height={6}
              rx={3}
              fill={theme.accentStrong}
            />

            {/* Air holes — what makes it a carrier and not a parcel. */}
            {HOLE_ROWS.map((cy) =>
              HOLE_COLUMNS.map((cx) => (
                <Circle
                  key={`${cx}:${cy}`}
                  cx={cx}
                  cy={cy}
                  r={HOLE_RADIUS}
                  fill={theme.accentStrong}
                />
              )),
            )}
          </Svg>
        </Animated.View>
      </Pressable>

      <Text variant="small" themeColor="textSecondary" style={styles.label}>
        {label}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: SPACING.two,
  },
  label: {
    textAlign: 'center',
  },
});

export type { PetBoxProps };
