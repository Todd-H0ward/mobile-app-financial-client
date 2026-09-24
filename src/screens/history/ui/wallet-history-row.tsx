import { memo } from 'react';

import { StyleSheet } from 'react-native';

import type { WalletHistoryRow, WalletSourceRef } from '@/entities/user';

import { useTranslation } from '@/shared/i18n';
import { ListRow, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WalletHistoryRowViewProps {
  row: WalletHistoryRow;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const sourceLabel = (
  source: WalletSourceRef,
  t: ReturnType<typeof useTranslation>['t'],
): string => {
  switch (source.kind) {
    case 'startingWallet':
      return t('wallet.source.startingWallet');
    case 'regularityBonus':
      return t('wallet.source.regularityBonus');
    case 'gamePuzzle':
      return t('wallet.source.gamePuzzle');
    case 'gameSpacewar':
      return t('wallet.source.gameSpacewar');
    case 'gameSnake':
      return t('wallet.source.gameSnake');
    case 'task':
      return t('wallet.source.task', {
        title: t(`tasks.items.${source.taskId}.title`, {
          defaultValue: source.title,
        }),
      });
    case 'purchase':
      return t('wallet.source.purchase', {
        title: t(`shop.items.${source.itemId}.title`, {
          defaultValue: source.title,
        }),
      });
    case 'savingsDeposit':
      return t('wallet.source.savingsDeposit', {
        title: t(`savings.goals.${source.goalId}.title`, {
          defaultValue: source.title,
        }),
      });
    case 'savingsWithdraw':
      return t('wallet.source.savingsWithdraw', {
        title: t(`savings.goals.${source.goalId}.title`, {
          defaultValue: source.title,
        }),
      });
    default:
      return t('wallet.source.unknown');
  }
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** One named coin movement — source and amount, never a bare number. */
export const WalletHistoryRowView = memo(
  ({ row }: WalletHistoryRowViewProps) => {
    const { t } = useTranslation();
    const sign = row.entry.kind === 'earn' ? '+' : '−';
    const amount = `${sign}${formatMoney(row.entry.amount)}`;

    return (
      <ListRow
        title={sourceLabel(row.source, t)}
        subtitle={t('history.walletPeriod', { period: row.entry.periodIndex })}
        trailing={
          <Text variant="smallBold" style={styles.amount}>
            {amount}
          </Text>
        }
      />
    );
  },
);

WalletHistoryRowView.displayName = 'WalletHistoryRowView';

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  amount: {
    minWidth: 40,
    textAlign: 'right',
  },
});

export type { WalletHistoryRowViewProps };
