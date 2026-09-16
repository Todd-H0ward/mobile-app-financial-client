import { type ReactNode, useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  type EmotionKey,
  type PetAppearance,
  type PetStage,
  reactionFor,
  zoneAt,
} from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetPlayProps {
  appearance: PetAppearance;
  /** Mood face while no gesture is playing out. */
  emotion: EmotionKey;
  stage: PetStage;
  size: number;
  isAnimated: boolean;
  accessibilityLabel: string;
  /** Mood caption under the pet — stays visible during a reaction. */
  footer?: ReactNode;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** How far up a lift may pull the pet, design points. */
const LIFT_MAX = 72;

const SPRING = { damping: 16, stiffness: 180 };

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Holds a short reaction face, then yields back to the mood. */
const useReaction = (moodEmotion: EmotionKey) => {
  const [override, setOverride] = useState<EmotionKey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const play = (emotion: EmotionKey, durationMs: number) => {
    if (timer.current) clearTimeout(timer.current);
    setOverride(emotion);
    timer.current = setTimeout(() => setOverride(null), durationMs);
  };

  return { emotion: override ?? moodEmotion, play };
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * A pet the child can poke, stroke and lift by the scruff.
 *
 * Soft only: a poke is a boop, a lift is a hang with a spring — never a kick
 * or a fall. Reactions are temporary faces from `reactionFor`; the mood face
 * always returns. Gestures live on the pet box alone so room swipes still
 * work beside it.
 */
export const PetPlay = ({
  appearance,
  emotion: moodEmotion,
  stage,
  size,
  isAnimated,
  accessibilityLabel,
  footer,
}: PetPlayProps) => {
  const { t } = useTranslation();
  const { emotion, play } = useReaction(moodEmotion);
  const liftY = useSharedValue(0);
  const boxHeight = useSharedValue(size);

  const trigger = (
    kind: 'poke' | 'stroke' | 'lift',
    y: number,
    height: number,
  ) => {
    const reaction = reactionFor(kind, zoneAt(y, height));
    play(reaction.emotion, reaction.durationMs);
  };

  const tap = Gesture.Tap().onEnd((event) => {
    runOnJS(trigger)('poke', event.y, boxHeight.value);
  });

  const stroke = Gesture.Pan()
    .activeOffsetY([-14, 14])
    .failOffsetX([-24, 24])
    .maxPointers(1)
    .onEnd((event) => {
      if (Math.abs(event.translationY) < 28) return;
      runOnJS(trigger)('stroke', event.y, boxHeight.value);
    });

  // Long-press then drag up: Talking-Tom scruff hang, released with a spring.
  const lift = Gesture.Pan()
    .activateAfterLongPress(320)
    .maxPointers(1)
    .onStart((event) => {
      runOnJS(trigger)('lift', event.y, boxHeight.value);
    })
    .onUpdate((event) => {
      // Only upwards — dragging down is not a hang.
      liftY.value = Math.max(-LIFT_MAX, Math.min(0, event.translationY));
    })
    .onFinalize(() => {
      liftY.value = withSpring(0, SPRING);
    });

  const gesture = Gesture.Exclusive(lift, stroke, tap);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: liftY.value }],
  }));

  return (
    <View style={styles.root}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel}. ${t('pet.play.a11y')}`}
          accessibilityHint={t('pet.play.hint')}
          onLayout={(event) => {
            boxHeight.value = event.nativeEvent.layout.height;
          }}
          style={liftStyle}
        >
          <PetView
            appearance={appearance}
            emotion={emotion}
            stage={stage}
            size={size}
            isAnimated={isAnimated}
            accessibilityLabel={accessibilityLabel}
          />
        </Animated.View>
      </GestureDetector>
      {footer}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: SPACING.two,
  },
});

export type { PetPlayProps };
