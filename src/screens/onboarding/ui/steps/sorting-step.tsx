import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

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

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CARD_ENTRANCE_DURATION = 220;
const EXPLANATION_DURATION = 180;
const DONE_MARK_SIZE = 28;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The sorting step: a card in hand and three baskets under it.
 *
 * Nothing can be failed here. A card tapped into the wrong basket still goes
 * away — into its own basket — and the pet names the rule instead of marking
 * the answer (2.2, 3.5). That is why there is no score on this screen and no
 * way back to a card.
 */
export const SortingStep = ({ onboarding }: SortingStepProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { sortItem, lastOutcome, sortProgress, placeItem } = onboarding;

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

  return (
    <View style={styles.root}>
      <Text variant="small" themeColor="textMuted" style={styles.counter}>
        {t('onboarding.sortedCounter', {
          done: sortProgress.done,
          total: sortProgress.total,
        })}
      </Text>

      {sortItem ? (
        <Animated.View
          key={sortItem.id}
          entering={ZoomIn.duration(CARD_ENTRANCE_DURATION)}
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.borderStrong },
          ]}
        >
          <Text variant="subtitle">{itemTitle}</Text>
          <Text variant="small" themeColor="textSecondary">
            {t('onboarding.whichBox')}
          </Text>
        </Animated.View>
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
          // Keyed by the card, so each explanation re-enters on its own.
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
            <DecisionBasket
              key={decision.id}
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
  root: {
    gap: SPACING.three,
  },
  baskets: {
    gap: SPACING.two,
  },
  card: {
    alignItems: 'center',
    borderRadius: RADII.xl,
    borderWidth: 1.5,
    gap: SPACING.one,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.four,
  },
  counter: {
    textAlign: 'center',
  },
});

export type { SortingStepProps };
