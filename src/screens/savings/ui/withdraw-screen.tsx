import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import {
  DYNAMIC_ROUTES,
  RADII,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, ProgressBar, Screen, Text } from '@/shared/ui';
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

/** Confirm shows the price of withdrawing — never a ban. */
export const WithdrawScreen = ({ goalId, amount }: WithdrawScreenProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
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

  const columns = [
    {
      key: 'now',
      label: t('savings.withdrawNow'),
      saved: explain.savedBefore,
      progress: explain.progressBefore,
      periods: explain.periodsBefore,
      isAfter: false,
    },
    {
      key: 'after',
      label: t('savings.withdrawAfter'),
      saved: explain.savedAfter,
      progress: explain.progressAfter,
      periods: explain.periodsAfter,
      isAfter: true,
    },
  ];

  return (
    <Screen presentation="sheet" gap={SPACING.COMPACT} terminalVariant="keeper">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Text variant="machine" themeColor="warning">
            {`! ${t('savings.withdrawLabel')}`}
          </Text>
          <Screen.Title>
            {t('savings.withdrawQuestion', {
              count: formatMoney(explain.amount),
              goal: title,
            })}
          </Screen.Title>
        </Screen.Heading>
        <HintButton screen="savings" />
      </Screen.Header>

      <View style={styles.compare}>
        {columns.map((column) => (
          <View
            key={column.key}
            style={[
              styles.compareCol,
              {
                borderColor: column.isAfter ? theme.warning : theme.border,
              },
              column.isAfter && styles.dashed,
            ]}
          >
            <Text variant="small" themeColor="textSecondary">
              {column.label}
            </Text>
            <Text
              variant="machine"
              themeColor={column.isAfter ? 'warning' : 'phosphor'}
              style={styles.bigNumber}
            >
              {formatMoney(column.saved)}
              <Text variant="code" themeColor="textMuted" style={styles.of}>
                {` /${formatMoney(explain.price)}`}
              </Text>
            </Text>
            <ProgressBar
              value={column.progress}
              segmentCount={Math.min(
                15,
                Math.max(1, Math.ceil(explain.price / 10)),
              )}
              height={8}
              color={column.isAfter ? 'warning' : 'primary'}
              trackColor="surfaceSoft"
            />
            {column.periods != null ? (
              <Text variant="small" themeColor="textSecondary">
                {t('savings.withdrawPeriodsShort', { count: column.periods })}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <Text variant="small" themeColor="textSecondary">
        {t('savings.withdrawSoft')}
      </Text>

      <View style={styles.actions}>
        <Button variant="primary" isFullWidth onPress={backToGoal}>
          {t('savings.withdrawKeep')}
        </Button>
        <Button
          variant="secondary"
          size="m"
          isFullWidth
          disabled={!withdraw.canConfirm}
          onPress={() => {
            if (withdraw.confirm()) backToGoal();
          }}
        >
          {t('savings.withdrawTake', { count: formatMoney(explain.amount) })}
        </Button>
      </View>
    </Screen>
  );
};

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
    gap: SPACING.TWO,
    marginTop: SPACING.ONE,
  },
  bigNumber: { fontSize: 25, lineHeight: 32 },
  compare: {
    flexDirection: 'row',
    gap: SPACING.TWO,
  },
  compareCol: {
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    gap: SPACING.TWO,
    padding: SPACING.COMPACT,
  },
  dashed: { borderStyle: 'dashed' },
  of: { fontSize: 14 },
});

export type { WithdrawScreenProps };
export { parseAmount };
