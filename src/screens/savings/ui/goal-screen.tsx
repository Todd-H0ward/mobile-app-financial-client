import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { RADII, ROUTES, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  CoinBadge,
  ProgressBar,
  Screen,
  Sheet,
  Text,
} from '@/shared/ui';
import { formatMoney, hitSlopFor } from '@/shared/utils';

import { useGoal } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GoalScreenProps {
  goalId: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const KEY_SIZE = 36;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const AmountStepper = ({
  value,
  max,
  onAdd,
  onRemove,
}: {
  value: number;
  max: number;
  onAdd: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const key = (
    sign: string,
    onPress: () => void,
    disabled: boolean,
    accessibilityLabel: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlopFor(KEY_SIZE)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: disabled ? theme.disabled : theme.surface,
          borderColor: theme.borderStrong,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="bodyBold" themeColor={disabled ? 'onDisabled' : 'text'}>
        {sign}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.stepper}>
      {key('−', onRemove, value <= 0, t('savings.amountRemove'))}
      <Text variant="title">{formatMoney(value)}</Text>
      {key('+', onAdd, value >= max, t('savings.amountAdd'))}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One goal's jar — put coins in, take them out with a named consequence.
 */
export const GoalScreen = ({ goalId }: GoalScreenProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const goal = useGoal(goalId);

  if (!goal) {
    return <Redirect href={ROUTES.SAVINGS} />;
  }

  const title = t(`savings.goals.${goal.goalId}.title`, {
    defaultValue: goal.title,
  });

  const amountMax = Math.max(goal.maxDeposit, goal.maxWithdraw);

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{title}</Screen.Title>
          <Screen.Subtitle>
            {goal.isReached
              ? t('savings.reached')
              : t('savings.remaining', {
                  count: formatMoney(goal.remaining),
                })}
          </Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="savings" />
      </Screen.Header>

      <CoinBadge
        amount={goal.balance}
        label={t('savings.balance')}
        coinSize={18}
      />

      <View style={styles.progressBlock}>
        <ProgressBar value={goal.progress} height={10} />
        <Text variant="bodyBold">{goal.progressLabel}</Text>
      </View>

      {!goal.canTransfer && (
        <Text themeColor="textSecondary">{t('savings.planFirstBanner')}</Text>
      )}

      {!goal.isActive && (
        <Button variant="secondary" isFullWidth onPress={goal.makeActive}>
          {t('savings.makeActive')}
        </Button>
      )}

      <View style={styles.amountBlock}>
        <Text variant="bodyBold">{t('savings.amountLabel')}</Text>
        <AmountStepper
          value={goal.amount}
          max={amountMax}
          onAdd={goal.addCoin}
          onRemove={goal.removeCoin}
        />
        <View style={styles.quick}>
          <Button
            variant="ghost"
            size="s"
            disabled={goal.maxDeposit <= 0}
            onPress={goal.setMaxDeposit}
          >
            {t('savings.quickDeposit', {
              count: formatMoney(goal.maxDeposit),
            })}
          </Button>
          <Button
            variant="ghost"
            size="s"
            disabled={goal.maxWithdraw <= 0}
            onPress={goal.setMaxWithdraw}
          >
            {t('savings.quickWithdraw', {
              count: formatMoney(goal.maxWithdraw),
            })}
          </Button>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          isFullWidth
          disabled={
            !goal.canTransfer ||
            goal.amount <= 0 ||
            goal.amount > goal.maxDeposit
          }
          onPress={goal.deposit}
        >
          {t('savings.deposit')}
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          disabled={
            !goal.canTransfer ||
            goal.amount <= 0 ||
            goal.amount > goal.maxWithdraw
          }
          onPress={goal.requestWithdraw}
        >
          {t('savings.withdraw')}
        </Button>
      </View>

      <Sheet.Modal
        isVisible={goal.sheet === 'withdraw' && goal.withdrawExplain != null}
        onClose={goal.dismissSheet}
      >
        <Sheet.Title>{t('savings.withdrawTitle')}</Sheet.Title>
        <Sheet.Description>
          {t('savings.withdrawBody', {
            count: formatMoney(goal.withdrawExplain?.amount ?? 0),
            goal: title,
            before: formatMoney(goal.withdrawExplain?.remainingBefore ?? 0),
            after: formatMoney(goal.withdrawExplain?.remainingAfter ?? 0),
          })}
          {goal.withdrawExplain?.periodsAfter != null
            ? `\n\n${t('savings.withdrawPeriods', {
                count: goal.withdrawExplain.periodsAfter,
              })}`
            : ''}
        </Sheet.Description>
        <Sheet.Actions>
          <Button variant="ghost" isFullWidth onPress={goal.dismissSheet}>
            {t('savings.withdrawKeep')}
          </Button>
          <Button variant="accent" isFullWidth onPress={goal.confirmWithdraw}>
            {t('savings.withdrawConfirm')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>

      <Sheet.Modal
        isVisible={goal.sheet === 'planning'}
        onClose={goal.dismissSheet}
      >
        <Sheet.Title>{t('savings.planFirstTitle')}</Sheet.Title>
        <Sheet.Description>{t('savings.planFirstBody')}</Sheet.Description>
        <Sheet.Actions>
          <Button variant="ghost" isFullWidth onPress={goal.dismissSheet}>
            {t('savings.cancel')}
          </Button>
          <Button
            variant="primary"
            isFullWidth
            onPress={() => {
              goal.dismissSheet();
              router.push(ROUTES.BUDGET_PLAN);
            }}
          >
            {t('savings.goPlan')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </Screen>
  );
};

/**
 * Resolves `/savings/[goalId]`. Unknown ids fall back to the showcase.
 */
export const GoalRouteScreen = ({ goalId }: { goalId: string }) => {
  if (!goalId) {
    return <Redirect href={ROUTES.SAVINGS} />;
  }

  return <GoalScreen goalId={goalId} />;
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.two,
  },
  amountBlock: {
    gap: SPACING.two,
  },
  key: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 1,
    height: KEY_SIZE,
    justifyContent: 'center',
    width: KEY_SIZE,
  },
  progressBlock: {
    gap: SPACING.two,
  },
  quick: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.three,
    justifyContent: 'center',
  },
});

export type { GoalScreenProps };
