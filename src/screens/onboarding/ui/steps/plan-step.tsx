import { StyleSheet, View } from 'react-native';

import { listDecisions } from '@/entities/onboarding';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Coin, Text } from '@/shared/ui';

import type { OnboardingController } from '../../model';
import { DecisionBasket } from '../decision-basket';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlanStepProps {
  onboarding: OnboardingController;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const COIN_SIZE = 30;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Rehearsal plan: tap a basket to drop one coin into it. Remainder is fine —
 * same rules as the real budget screen (docs/budget.md).
 */
export const PlanStep = ({ onboarding }: PlanStepProps) => {
  const { t } = useTranslation();
  const { plan, planLeft, planTotal, addCoin, removeCoin } = onboarding;

  const tray = Array.from({ length: planLeft }, (_, index) => index);

  return (
    <View style={styles.root}>
      <View style={styles.remainder}>
        <Text variant="bodyBold" style={styles.center}>
          {t('onboarding.remainder', { count: planLeft })}
        </Text>
        <View style={styles.tray}>
          {tray.map((index) => (
            <Coin key={index} size={COIN_SIZE} isActive={index === 0} />
          ))}
          {planLeft === 0 && (
            <Text variant="small" themeColor="successStrong">
              {t('onboarding.trayEmpty')}
            </Text>
          )}
        </View>
        <Text variant="small" themeColor="textSecondary" style={styles.center}>
          {t('onboarding.remainderHint')}
        </Text>
      </View>

      <View style={styles.baskets}>
        {listDecisions().map((decision) => {
          const count = plan[decision.id];
          const label = t(`onboarding.decisions.${decision.id}.title`, {
            defaultValue: decision.title,
          });

          return (
            <DecisionBasket
              key={decision.id}
              direction={decision.id}
              title={decision.title}
              example={decision.example}
              isRow
              onPress={planLeft > 0 ? () => addCoin(decision.id) : undefined}
              accessibilityLabel={t('onboarding.dropCoinA11y', { label })}
              trailing={
                <View style={styles.slot}>
                  {count > 0 ? (
                    <View style={styles.stack}>
                      {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                        <Coin key={i} size={22} />
                      ))}
                      {count > 4 && (
                        <Text variant="label" themeColor="textMuted">
                          +{count - 4}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text variant="label" themeColor="textMuted">
                      0
                    </Text>
                  )}
                  {count > 0 && (
                    <Text
                      variant="label"
                      themeColor="primaryStrong"
                      onPress={() => removeCoin(decision.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('onboarding.stepperMinusA11y', {
                        label,
                      })}
                    >
                      {t('onboarding.takeBack')}
                    </Text>
                  )}
                </View>
              }
            />
          );
        })}
      </View>

      <Text variant="label" themeColor="textMuted" style={styles.center}>
        {t('onboarding.planProgress', {
          laid: planTotal - planLeft,
          total: planTotal,
        })}
      </Text>
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
  center: {
    textAlign: 'center',
  },
  remainder: {
    gap: SPACING.two,
  },
  root: {
    gap: SPACING.three,
  },
  slot: {
    alignItems: 'flex-end',
    gap: SPACING.half,
    minWidth: 72,
  },
  stack: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  tray: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.one,
    justifyContent: 'center',
    minHeight: 36,
  },
});

export type { PlanStepProps };
