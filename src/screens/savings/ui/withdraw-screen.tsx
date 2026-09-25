import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, ProgressBar, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useWithdraw } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WithdrawScreenProps {
  goalId: string;
  amount: number;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const parseAmount = (raw: string | undefined): number | null => {
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Separate confirm screen before taking coins from the jar — 1.15 / 2.5.7.
 *
 * Shows recalculated consequences (remaining before/after, progress bars,
 * period estimate) so the child sees the price of the choice, not a ban.
 */
export const WithdrawScreen = ({ goalId, amount }: WithdrawScreenProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const withdraw = useWithdraw(goalId, amount);

  if (!withdraw) {
    return <Redirect href={STATIC_ROUTES.SAVINGS} />;
  }

  const title = t(`savings.goals.${withdraw.goalId}.title`, {
    defaultValue: withdraw.title,
  });
  const { explain } = withdraw;

  const backToGoal = () => {
    router.replace(DYNAMIC_ROUTES.goal(goalId));
  };

  return (
    <Screen gap="three">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('savings.withdrawTitle')}</Screen.Title>
          <Screen.Subtitle>
            {t('savings.withdrawSubtitle', {
              count: formatMoney(explain.amount),
              goal: title,
            })}
          </Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="savings" />
      </Screen.Header>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('savings.withdrawConsequence')}</Text>
          <Text themeColor="textSecondary">
            {t('savings.withdrawBody', {
              count: formatMoney(explain.amount),
              goal: title,
              before: formatMoney(explain.remainingBefore),
              after: formatMoney(explain.remainingAfter),
            })}
          </Text>
          {explain.periodsAfter != null ? (
            <Text themeColor="textSecondary">
              {explain.periodsBefore != null
                ? t('savings.withdrawPeriodsCompare', {
                    after: explain.periodsAfter,
                    before: explain.periodsBefore,
                  })
                : t('savings.withdrawPeriods', {
                    count: explain.periodsAfter,
                  })}
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      <View style={styles.compare}>
        <View style={styles.compareCol}>
          <Text variant="smallBold">{t('savings.withdrawNow')}</Text>
          <ProgressBar value={explain.progressBefore} height={10} />
          <Text variant="small" themeColor="textMuted">
            {t('home.goal.progress', {
              saved: formatMoney(explain.savedBefore),
              price: formatMoney(explain.price),
            })}
          </Text>
          <Text variant="small" themeColor="textSecondary">
            {t('savings.remaining', {
              count: formatMoney(explain.remainingBefore),
            })}
          </Text>
        </View>

        <View style={styles.compareCol}>
          <Text variant="smallBold">{t('savings.withdrawAfter')}</Text>
          <ProgressBar value={explain.progressAfter} height={10} />
          <Text variant="small" themeColor="textMuted">
            {t('home.goal.progress', {
              saved: formatMoney(explain.savedAfter),
              price: formatMoney(explain.price),
            })}
          </Text>
          <Text variant="small" themeColor="textSecondary">
            {t('savings.remaining', {
              count: formatMoney(explain.remainingAfter),
            })}
          </Text>
        </View>
      </View>

      <Text themeColor="textSecondary">{t('savings.withdrawSoft')}</Text>

      <View style={styles.actions}>
        <Button variant="ghost" isFullWidth onPress={backToGoal}>
          {t('savings.withdrawKeep')}
        </Button>
        <Button
          variant="accent"
          isFullWidth
          disabled={!withdraw.canConfirm}
          onPress={() => {
            if (withdraw.confirm()) backToGoal();
          }}
        >
          {t('savings.withdrawConfirm')}
        </Button>
      </View>
    </Screen>
  );
};

/**
 * Resolves `/savings/[goalId]/withdraw?amount=…`. Bad params fall back home
 * to the goal jar.
 */
export const WithdrawRouteScreen = ({
  goalId,
  amountParam,
}: {
  goalId: string;
  amountParam?: string;
}) => {
  const amount = parseAmount(amountParam);

  if (!goalId || amount == null) {
    return (
      <Redirect
        href={goalId ? DYNAMIC_ROUTES.goal(goalId) : STATIC_ROUTES.SAVINGS}
      />
    );
  }

  return <WithdrawScreen goalId={goalId} amount={amount} />;
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.two,
  },
  compare: {
    flexDirection: 'row',
    gap: SPACING.three,
  },
  compareCol: {
    flex: 1,
    gap: SPACING.two,
  },
});

export type { WithdrawScreenProps };
export { parseAmount };
