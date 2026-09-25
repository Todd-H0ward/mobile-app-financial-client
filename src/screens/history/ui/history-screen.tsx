import { useCallback } from 'react';

import { FlatList, type ListRenderItem, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import {
  type PeriodRecord,
  useUserStore,
  type WalletHistoryRow,
} from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, ListRow, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useHistory } from '../model';

import { WalletHistoryRowView } from './wallet-history-row';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Approximate `ListRow` height — enough for virtualization windows. */
const WALLET_ROW_HEIGHT = 72;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const keyExtractor = (row: WalletHistoryRow): string => row.entry.id;

const getItemLayout = (_: unknown, index: number) => ({
  length: WALLET_ROW_HEIGHT,
  offset: WALLET_ROW_HEIGHT * index,
  index,
});

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Period report + named wallet lines — 2.5.11 / roadmap 1.20.
 *
 * Last finished period gets plan/fact totals; every credit and spend shows
 * its source. Empty history is honest, not a blank screen.
 *
 * Wallet lines use `FlatList` (docs/performance.md) — up to
 * `WALLET_HISTORY_LIMIT` rows must not mount at once inside `Screen`'s
 * `ScrollView`.
 */
export const HistoryScreen = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const receipts = useUserStore((state) => state.user?.platform.receipts);

  const renderItem: ListRenderItem<WalletHistoryRow> = useCallback(
    ({ item }) => <WalletHistoryRowView row={item} />,
    [],
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('history.title')}</Screen.Title>
          <Screen.Subtitle>{t('history.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="history" />
      </Screen.Header>

      {receipts && receipts.length > 0 ? (
        <Card tone="surfaceSoft">
          <Card.Content>
            <Text variant="bodyBold">{t('scene.liftHistory')}</Text>
            {[...receipts].reverse().map((receipt) => (
              <Text key={receipt.id}>
                {t('scene.liftReceipt', {
                  level: receipt.level,
                  amount: receipt.amount,
                  period: receipt.periodIndex,
                  remaining: receipt.savingsAfter,
                })}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}
      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('history.lastPeriod')}</Text>
          {history.lastPeriod == null ? (
            <Text themeColor="textSecondary">{t('history.emptyPeriods')}</Text>
          ) : (
            <View style={styles.lastPeriod}>
              <Text themeColor="textSecondary">
                {t('history.periodLabel', {
                  period: history.lastPeriod.index,
                })}
              </Text>
              {history.lastRows.map((row) => (
                <Text key={row.direction} themeColor="textSecondary">
                  {t(`budgetPlan.directions.${row.direction}.title`)}
                  {': '}
                  {t('history.planFact', {
                    plan: formatMoney(row.planned),
                    fact: formatMoney(row.actual),
                  })}
                </Text>
              ))}
              {history.lastExplain ? (
                <Text themeColor="textSecondary">
                  {t(`periodSummary.story.${history.lastExplain.storyKey}`, {
                    over: history.lastExplain.overspent
                      .map((id) => t(`budgetPlan.directions.${id}.title`))
                      .join(', '),
                    under: history.lastExplain.underspent
                      .map((id) => t(`budgetPlan.directions.${id}.title`))
                      .join(', '),
                  })}
                </Text>
              ) : null}
            </View>
          )}
        </Card.Content>
      </Card>

      {history.periods.length > 0 ? (
        <View style={styles.section}>
          <Text variant="bodyBold">{t('history.allPeriods')}</Text>
          {history.periods.map((period: PeriodRecord) => (
            <ListRow
              key={period.index}
              title={t('history.periodLabel', { period: period.index })}
              subtitle={
                period.isPlanKept
                  ? t('history.planKept')
                  : t('history.planMissed')
              }
              trailing={
                period.reachedGoalIds.length > 0 ? (
                  <Text variant="small" themeColor="textMuted">
                    {t('history.goalsReached', {
                      count: period.reachedGoalIds.length,
                    })}
                  </Text>
                ) : null
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.walletHeading}>
        <Text variant="bodyBold">{t('history.wallet')}</Text>
        {history.walletRows.length === 0 ? (
          <Text themeColor="textSecondary">{t('history.emptyWallet')}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen gap="three" isTabBarVisible={false} isScrollable={false}>
      <FlatList
        data={history.walletRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  headerBlock: {
    gap: SPACING.three,
    marginBottom: SPACING.two,
  },
  lastPeriod: {
    gap: SPACING.one,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    flexGrow: 1,
    gap: SPACING.two,
    paddingBottom: SPACING.two,
  },
  section: {
    gap: SPACING.two,
  },
  walletHeading: {
    gap: SPACING.two,
  },
});
