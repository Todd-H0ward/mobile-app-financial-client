import { useCallback, useState } from 'react';

import { FlatList, type ListRenderItem, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import {
  type PeriodRecord,
  useUserStore,
  type WalletHistoryRow,
} from '@/entities/user';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Card,
  Chip,
  PixelIcon,
  type PixelIconName,
  Screen,
  Segmented,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useHistory } from '../model';

import { WalletHistoryRowView } from './wallet-history-row';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type HistoryTab = 'periods' | 'coins' | 'trials';

interface PeriodCardProps {
  period: PeriodRecord;
}

interface EmptyStateProps {
  title: string;
  body?: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BOXES: { key: 'needs' | 'wants' | 'savings'; icon: PixelIconName }[] = [
  { key: 'needs', icon: 'battery' },
  { key: 'wants', icon: 'gear' },
  { key: 'savings', icon: 'piggy' },
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const keyExtractor = (row: WalletHistoryRow): string => row.entry.id;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** UI kit 11: the machine says the log is empty, a person says what to do. */
const EmptyState = ({ title, body }: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Text variant="code" themeColor="textMuted">
        {`> ${t('history.emptyLabel')}`}
      </Text>
      <Text variant="subtitle">{title}</Text>
      {body ? <Text themeColor="textSecondary">{body}</Text> : null}
    </View>
  );
};

/**
 * One finished period (screen 14). Its status has a shape of its own:
 * filled for "сбылся", an amber outline with "!" for "разошёлся".
 */
const PeriodCard = ({ period }: PeriodCardProps) => {
  const { t } = useTranslation();

  return (
    <Card isSelected={period.isPlanKept}>
      <View style={styles.periodHead}>
        <Text variant="subtitle" style={styles.periodTitle}>
          {t('history.periodLabel', { period: period.index })}
        </Text>
        <Chip variant={period.isPlanKept ? 'selected' : 'warning'}>
          {(period.isPlanKept
            ? t('history.kept')
            : t('history.missed')
          ).toLocaleUpperCase()}
        </Chip>
      </View>
      <View style={styles.boxes}>
        {BOXES.map(({ key, icon }) => {
          const isOver =
            key !== 'savings' && period.fact[key] > period.plan[key];
          return (
            <View key={key} style={styles.box}>
              <View style={styles.boxLabel}>
                <PixelIcon name={icon} size={12} />
                <Text variant="small" themeColor="textMuted">
                  {t(`boxes.${key}`).toLocaleLowerCase()}
                </Text>
              </View>
              <Text
                variant="code"
                themeColor={isOver ? 'warning' : 'text'}
                style={styles.boxValue}
              >
                {`${formatMoney(period.fact[key])}/${formatMoney(period.plan[key])}`}
              </Text>
            </View>
          );
        })}
      </View>
      {period.reachedGoalIds.length > 0 ? (
        <View style={styles.boxLabel}>
          <PixelIcon name="piggy" size={12} />
          <Text variant="small" themeColor="textSecondary">
            {t('history.goals', { count: period.reachedGoalIds.length })}
          </Text>
        </View>
      ) : null}
    </Card>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The log — 2.5.11 (screen 14): finished periods, every coin with its source,
 * and the trials passed. Empty tabs are honest, not blank.
 *
 * Coin lines use `FlatList` (docs/performance.md) — up to
 * `WALLET_HISTORY_LIMIT` rows must not mount at once inside `Screen`'s
 * `ScrollView`.
 */
export const HistoryScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();
  const receipts = useUserStore((state) => state.user?.platform.receipts);
  const [tab, setTab] = useState<HistoryTab>('periods');

  const rows =
    tab === 'trials'
      ? history.walletRows.filter((row) => row.source.kind === 'task')
      : history.walletRows;

  const lastIndex = rows.length - 1;
  const renderItem: ListRenderItem<WalletHistoryRow> = useCallback(
    ({ item, index }) => (
      // The rows read as one framed list, like the kit's history block.
      <View
        style={[
          styles.cell,
          { backgroundColor: theme.surface, borderColor: theme.border },
          index === 0 && styles.cellFirst,
          index === lastIndex && styles.cellLast,
        ]}
      >
        <WalletHistoryRowView row={item} isDivided={index > 0} />
      </View>
    ),
    [lastIndex, theme],
  );

  const header = (
    <View style={styles.headerBlock}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>{t('history.label')}</Screen.Label>
          <Screen.Title>{t('history.title')}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="history" />
      </Screen.Header>

      <Segmented
        options={[
          { value: 'periods', label: t('history.tabPeriods') },
          { value: 'coins', label: t('history.tabCoins') },
          { value: 'trials', label: t('history.tabTrials') },
        ]}
        value={tab}
        onChange={setTab}
      />
    </View>
  );

  if (tab === 'periods') {
    return (
      <Screen gap="compact">
        {header}
        {receipts && receipts.length > 0 ? (
          <Card>
            <Card.Content>
              <Text variant="bodyBold">{t('scene.liftHistory')}</Text>
              {[...receipts].reverse().map((receipt) => (
                <Text key={receipt.id} themeColor="textSecondary">
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
        {history.periods.length === 0 ? (
          <EmptyState
            title={t('history.emptyTitle')}
            body={t('history.emptyBody')}
          />
        ) : (
          [...history.periods]
            .reverse()
            .map((period) => <PeriodCard key={period.index} period={period} />)
        )}
      </Screen>
    );
  }

  return (
    <Screen gap="compact" isScrollable={false}>
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={styles.listHeader}
        ListEmptyComponent={
          <EmptyState
            title={
              tab === 'trials'
                ? t('history.emptyTrials')
                : t('history.emptyWallet')
            }
          />
        }
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={7}
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
  box: { flex: 1, gap: 2 },
  boxes: { flexDirection: 'row', gap: SPACING.two },
  boxLabel: { alignItems: 'center', flexDirection: 'row', gap: SPACING.one },
  boxValue: { fontSize: 15 },
  cell: { borderLeftWidth: 2, borderRightWidth: 2 },
  cellFirst: {
    borderTopLeftRadius: RADII.m,
    borderTopRightRadius: RADII.m,
    borderTopWidth: 2,
  },
  cellLast: {
    borderBottomLeftRadius: RADII.m,
    borderBottomRightRadius: RADII.m,
    borderBottomWidth: 2,
  },
  empty: { gap: SPACING.two, paddingVertical: SPACING.three },
  headerBlock: { gap: SPACING.compact },
  list: { flex: 1, width: '100%' },
  listContent: {
    flexGrow: 1,
    paddingBottom: SPACING.two,
  },
  listHeader: { marginBottom: SPACING.compact },
  periodHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'space-between',
  },
  periodTitle: { flexShrink: 1 },
});

export type { HistoryTab };
