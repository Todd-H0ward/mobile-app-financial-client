import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { BUDGET_DIRECTIONS } from '@/entities/economy';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, ProgressBar, Screen, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useBudgetPlan } from '../model';

import { DirectionRow } from './direction-row';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The real plan screen — three directions, remainder always visible, confirm
 * starts the period. Same rules the onboarding rehearsal already taught.
 */
export const BudgetPlanScreen = () => {
  const { t } = useTranslation();
  const plan = useBudgetPlan();

  const laidOut =
    plan.available > 0 ? (plan.available - plan.planLeft) / plan.available : 0;

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('budgetPlan.title')}</Screen.Title>
          <Screen.Subtitle>
            {t('budgetPlan.available', { count: formatMoney(plan.available) })}
          </Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="budget-plan" />
      </Screen.Header>

      <View style={styles.remainder}>
        <Text variant="bodyBold">
          {t('budgetPlan.remainder', { count: formatMoney(plan.planLeft) })}
        </Text>
        <ProgressBar
          value={laidOut}
          accessibilityLabel={t('budgetPlan.progressA11y', {
            percent: Math.round(laidOut * 100),
          })}
        />
        <Text variant="small" themeColor="textSecondary">
          {plan.isBroke
            ? t('budgetPlan.brokeHint')
            : t('budgetPlan.remainderHint')}
        </Text>
      </View>

      <View style={styles.rows}>
        {BUDGET_DIRECTIONS.map((direction) => (
          <DirectionRow
            key={direction}
            direction={direction}
            value={plan.plan[direction]}
            remainder={plan.planLeft}
            onChange={(value) => plan.setDirection(direction, value)}
            onAdd={() => plan.addCoin(direction)}
            onRemove={() => plan.removeCoin(direction)}
          />
        ))}
      </View>

      <Button
        variant="primary"
        size="l"
        isFullWidth
        disabled={!plan.canConfirm}
        onPress={plan.requestConfirm}
      >
        {plan.isBroke ? t('budgetPlan.confirmBroke') : t('budgetPlan.confirm')}
      </Button>

      <Sheet.Modal
        isVisible={plan.isNeedsWarningVisible}
        onClose={plan.dismissNeedsWarning}
      >
        <Sheet.Title>{t('budgetPlan.needsZeroTitle')}</Sheet.Title>
        <Sheet.Description>{t('budgetPlan.needsZeroBody')}</Sheet.Description>
        <Sheet.Actions>
          <Button
            variant="ghost"
            isFullWidth
            onPress={plan.dismissNeedsWarning}
          >
            {t('budgetPlan.needsZeroKeep')}
          </Button>
          <Button
            variant="accent"
            isFullWidth
            onPress={plan.confirmDespiteNeeds}
          >
            {t('budgetPlan.needsZeroConfirm')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  remainder: {
    gap: SPACING.two,
  },
  rows: {
    gap: SPACING.two,
  },
});
