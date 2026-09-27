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
import { useIsMotionEnabled } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, PixelIcon, Sheet, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** `round` sits in a terminal header; `hud` hangs on a cable over the pit. */
type HintButtonVariant = 'round' | 'hud';

interface HintButtonProps {
  /** Screen whose hint opens. Every screen id has content — see 2.5.1. */
  screen: HintScreenId;
  variant?: HintButtonVariant;
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
const BUTTON_SIZE = 48;
const HUD_SIZE = 44;

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
export const HintButton = ({
  screen,
  variant = 'round',
  isPulsing = false,
}: HintButtonProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const hint = getHint(screen);
  const [isOpen, setIsOpen] = useState(false);

  const title = t(`hints.${screen}.title`, { defaultValue: hint.title });
  const rawBody = t(`hints.${screen}.body`, {
    returnObjects: true,
    defaultValue: hint.body,
  });
  const body = Array.isArray(rawBody) ? (rawBody as string[]) : hint.body;

  // The grown-up's switch and the system Reduce Motion decide — 3.6, weak
  // devices.
  const isMotionEnabled = useIsMotionEnabled();

  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isPulsing || !isMotionEnabled) return;

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
  }, [isPulsing, isMotionEnabled, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <Animated.View style={pulseStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('hints.buttonA11y')}
          accessibilityHint={t('hints.buttonA11yHint', { title })}
          hitSlop={hitSlopFor(BUTTON_SIZE)}
          onPress={() => setIsOpen(true)}
          style={({ pressed }) =>
            variant === 'hud'
              ? [styles.hud, { backgroundColor: theme.bezel }]
              : [
                  styles.root,
                  {
                    backgroundColor: pressed ? theme.surfaceSoft : undefined,
                    borderColor: pressed ? theme.phosphor : theme.border,
                  },
                ]
          }
        >
          {({ pressed }) =>
            variant === 'hud' ? (
              <View
                style={[
                  styles.hudScreen,
                  {
                    backgroundColor: pressed
                      ? theme.surfaceSoft
                      : theme.terminalScreen,
                  },
                ]}
              >
                <PixelIcon name="question" size={24} />
              </View>
            ) : (
              <PixelIcon name="question" size={24} />
            )
          }
        </Pressable>
      </Animated.View>

      <Sheet.Modal
        isVisible={isOpen}
        onClose={() => setIsOpen(false)}
        isAnimated={isMotionEnabled}
      >
        <View style={styles.heading}>
          <View style={[styles.badge, { borderColor: theme.phosphor }]}>
            <PixelIcon name="question" size={24} />
          </View>
          <View style={styles.headingCopy}>
            <Text variant="code" themeColor="textMuted">
              {t('hints.label')}
            </Text>
            <Sheet.Title>{title}</Sheet.Title>
          </View>
        </View>

        <View style={styles.body}>
          {body.map((paragraph, index) => (
            <View key={paragraph} style={styles.step}>
              <Text variant="machine" style={styles.stepNumber}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Sheet.Description style={styles.stepText}>
                {paragraph}
              </Sheet.Description>
            </View>
          ))}
        </View>

        <Sheet.Actions>
          <Button isFullWidth onPress={() => setIsOpen(false)}>
            {t('hints.understood')}
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
  badge: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  body: {
    gap: SPACING.compact,
  },
  heading: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headingCopy: { flex: 1 },
  hud: {
    borderRadius: 12,
    height: HUD_SIZE,
    padding: SPACING.one,
    width: HUD_SIZE,
  },
  hudScreen: {
    alignItems: 'center',
    borderRadius: SPACING.two,
    flex: 1,
    justifyContent: 'center',
  },
  root: {
    alignItems: 'center',
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  step: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  stepNumber: { fontSize: 15, lineHeight: 22 },
  stepText: { flex: 1 },
});

export type { HintButtonProps, HintButtonVariant };
