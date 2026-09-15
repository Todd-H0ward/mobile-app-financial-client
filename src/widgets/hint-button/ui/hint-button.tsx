import { useEffect, useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getHint, type HintScreenId } from '@/entities/hint';
import { useUserStore } from '@/entities/user';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Button, Sheet, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HintButtonProps {
  /** Screen whose hint opens. Every screen id has content — see 2.5.1. */
  screen: HintScreenId;
  /**
   * Draws attention once, right after mount. Used on the first screen a child
   * ever sees, so that "help is always here" is learned instead of announced.
   */
  isPulsing?: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the control; hitSlop expands the target to HIT_SLOP_SIZE. */
const BUTTON_SIZE = 40;

const PULSE_SCALE = 1.12;
const PULSE_DURATION = 420;
/** Two beats and done. A control that keeps pulsing becomes furniture. */
const PULSE_COUNT = 2;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The "?" that sits in the header of every screen, always in the same corner —
 * requirement 2.5.1, help available at any moment.
 *
 * It owns no words: the text comes from `content/hints.json` through
 * `entities/hint`, so a screen's hint is rewritten without opening a `.tsx`.
 */
export const HintButton = ({ screen, isPulsing = false }: HintButtonProps) => {
  const theme = useTheme();
  const hint = getHint(screen);
  const [isOpen, setIsOpen] = useState(false);

  // There is no profile yet during onboarding, and the grown-up's switch is
  // still the authority once there is one — 3.6, weak devices.
  const isAnimationEnabled = useUserStore(
    (state) => state.user?.settings.isAnimationEnabled ?? true,
  );

  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isPulsing || !isAnimationEnabled) return;

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
  }, [isPulsing, isAnimationEnabled, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <Animated.View style={pulseStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Подсказка"
          accessibilityHint={`Откроется подсказка: ${hint.title}`}
          hitSlop={hitSlopFor(BUTTON_SIZE)}
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [
            styles.root,
            {
              backgroundColor: theme.primarySoft,
              borderColor: theme.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text variant="bodyBold" themeColor="primaryStrong">
            ?
          </Text>
        </Pressable>
      </Animated.View>

      <Sheet.Modal isVisible={isOpen} onClose={() => setIsOpen(false)}>
        <Sheet.Title>{hint.title}</Sheet.Title>

        <View style={styles.body}>
          {hint.body.map((paragraph) => (
            <Sheet.Description key={paragraph}>{paragraph}</Sheet.Description>
          ))}
        </View>

        <Sheet.Actions>
          <Button isFullWidth onPress={() => setIsOpen(false)}>
            Понятно
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  body: {
    gap: SPACING.two,
  },
});

export type { HintButtonProps };
