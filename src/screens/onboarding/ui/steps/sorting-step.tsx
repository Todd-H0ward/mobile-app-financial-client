import { useCallback, useRef } from 'react';

import { type View as RNView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';

import type { BudgetDirection } from '@/entities/economy';
import { listDecisions } from '@/entities/onboarding';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Shape, Text } from '@/shared/ui';

import type { OnboardingController } from '../../model';
import { DecisionBasket } from '../decision-basket';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SortingStepProps {
  onboarding: OnboardingController;
}

interface BasketFrame {
  direction: BudgetDirection;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CARD_ENTRANCE_DURATION = 220;
const EXPLANATION_DURATION = 180;
const DONE_MARK_SIZE = 28;
const SPRING = { damping: 18, stiffness: 200 };

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Drag a card into one of three baskets. A miss still lands in the right
 * basket and the pet names the rule — nothing can be failed (2.2, 3.5).
 * Tapping a basket still works for accessibility.
 */
export const SortingStep = ({ onboarding }: SortingStepProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { sortItem, lastOutcome, sortProgress, placeItem } = onboarding;

  const basketFrames = useRef<BasketFrame[]>([]);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  const itemTitle = sortItem
    ? t(`onboarding.items.${sortItem.id}.title`, {
        defaultValue: sortItem.title,
      })
    : '';

  const outcomeExplanation = lastOutcome
    ? t(`onboarding.items.${lastOutcome.placement.itemId}.explanation`, {
        defaultValue: lastOutcome.explanation,
      })
    : '';

  const resetCard = useCallback(() => {
    translateX.value = withSpring(0, SPRING);
    translateY.value = withSpring(0, SPRING);
    dragScale.value = withSpring(1, SPRING);
  }, [dragScale, translateX, translateY]);

  const dropAt = useCallback(
    (absX: number, absY: number) => {
      const hit = basketFrames.current.find(
        (frame: BasketFrame) =>
          absX >= frame.x &&
          absX <= frame.x + frame.width &&
          absY >= frame.y &&
          absY <= frame.y + frame.height,
      );
      if (hit) {
        placeItem(hit.direction);
      }
      resetCard();
    },
    [placeItem, resetCard],
  );

  const pan = Gesture.Pan()
    .enabled(sortItem != null)
    .onBegin(() => {
      dragScale.value = withSpring(1.05, SPRING);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(dropAt)(e.absoluteX, e.absoluteY);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: dragScale.value },
    ],
    zIndex: 20,
  }));

  const registerBasket = (direction: BudgetDirection, ref: RNView | null) => {
    if (!ref) return;
    ref.measureInWindow((x, y, width, height) => {
      basketFrames.current = [
        ...basketFrames.current.filter(
          (frame: BasketFrame) => frame.direction !== direction,
        ),
        { direction, x, y, width, height },
      ];
    });
  };

  return (
    <View style={styles.root}>
      <Text variant="small" themeColor="textMuted" style={styles.counter}>
        {t('onboarding.sortedCounter', {
          done: sortProgress.done,
          total: sortProgress.total,
        })}
      </Text>

      {sortItem ? (
        <GestureDetector gesture={pan}>
          <Animated.View
            key={sortItem.id}
            entering={ZoomIn.duration(CARD_ENTRANCE_DURATION)}
          >
            <Animated.View
              style={[
                styles.card,
                cardStyle,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderStrong,
                  shadowColor: theme.text,
                },
              ]}
            >
              <Text variant="subtitle">{itemTitle}</Text>
              <Text variant="small" themeColor="textSecondary">
                {t('onboarding.whichBox')}
              </Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.successSoft, borderColor: theme.success },
          ]}
        >
          <Shape variant="leaf" size={DONE_MARK_SIZE} color={theme.success} />
          <Text variant="subtitle" themeColor="successStrong">
            {t('onboarding.allSorted')}
          </Text>
        </View>
      )}

      {lastOutcome && (
        <Animated.View
          key={lastOutcome.placement.itemId}
          entering={FadeIn.duration(EXPLANATION_DURATION)}
        >
          <Text variant="small" themeColor="textSecondary">
            {outcomeExplanation}
          </Text>
        </Animated.View>
      )}

      <View style={styles.baskets}>
        {listDecisions().map((decision) => {
          const decisionTitle = t(`onboarding.decisions.${decision.id}.title`, {
            defaultValue: decision.title,
          });

          return (
            <View
              key={decision.id}
              ref={(node) => {
                registerBasket(decision.id, node as RNView | null);
              }}
              onLayout={() => {
                // Re-measure after layout settles.
              }}
            >
              <DecisionBasket
                direction={decision.id}
                title={decision.title}
                example={decision.example}
                isRow
                onPress={sortItem ? () => placeItem(decision.id) : undefined}
                accessibilityLabel={
                  sortItem
                    ? t('onboarding.sortCardA11y', {
                        item: itemTitle,
                        decision: decisionTitle,
                      })
                    : decisionTitle
                }
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  baskets: {
    gap: SPACING.two,
  },
  card: {
    alignItems: 'center',
    borderRadius: RADII.xl,
    borderWidth: 2,
    elevation: 4,
    gap: SPACING.one,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.four,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  counter: {
    textAlign: 'center',
  },
  root: {
    gap: SPACING.three,
  },
});

export type { SortingStepProps };
